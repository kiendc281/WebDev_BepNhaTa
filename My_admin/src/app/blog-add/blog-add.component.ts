import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { BlogService } from '../services/blog.service';
import { AccountService } from '../services/account.service';
import { Blog } from '../models/blog.interface';
import { Account } from '../models/account.interface';

@Component({
  selector: 'app-blog-add',
  templateUrl: './blog-add.component.html',
  styleUrls: ['./blog-add.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class BlogAddComponent implements OnInit {
  blogForm!: FormGroup;
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  adminAccounts: Account[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private blogService: BlogService,
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.addInitialSection();
    this.loadAdminAccounts();
  }

  private loadAdminAccounts(): void {
    this.isLoading = true;
    this.accountService.getAdminAccounts().subscribe(
      (accounts) => {
        this.adminAccounts = accounts;
        console.log('Loaded admin accounts:', this.adminAccounts);
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading admin accounts:', error);
        this.errorMessage =
          'Không thể tải danh sách tác giả. Vui lòng thử lại sau.';
        this.isLoading = false;
      }
    );
  }

  private initForm(): void {
    this.blogForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      slug: ['', Validators.required],
      author: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(20)]],
      thumbnail: ['', Validators.required],
      category: this.fb.group({
        _id: ['', Validators.required],
        name: [''],
      }),
      publishDate: [new Date().toISOString()],
      sections: this.fb.array([]),
    });
  }

  private addInitialSection(): void {
    this.sections.push(this.createSectionFormGroup());
  }

  // Section management
  get sections() {
    return this.blogForm.get('sections') as FormArray;
  }

  createSectionFormGroup(): FormGroup {
    return this.fb.group({
      order: [this.sections.length + 1, Validators.required],
      content: this.fb.group({
        title: ['', Validators.required],
        text: this.fb.array([this.fb.control('', Validators.required)]),
      }),
      imageUrl: [''],
      imageCaption: [''],
    });
  }

  addSection(): void {
    this.sections.push(this.createSectionFormGroup());
  }

  removeSection(index: number): void {
    if (this.sections.length > 1) {
      this.sections.removeAt(index);
      // Update order of remaining sections
      this.reorderSections();
    } else {
      this.errorMessage = 'Blog phải có ít nhất một phần nội dung';
      setTimeout(() => {
        this.errorMessage = null;
      }, 3000);
    }
  }

  reorderSections(): void {
    this.sections.controls.forEach((control, index) => {
      control.get('order')?.setValue(index + 1);
    });
  }

  // Text paragraph management
  getTextArray(sectionIndex: number): FormArray {
    return this.sections.at(sectionIndex).get('content.text') as FormArray;
  }

  addParagraph(sectionIndex: number): void {
    const textArray = this.getTextArray(sectionIndex);
    textArray.push(this.fb.control('', Validators.required));
  }

  removeParagraph(sectionIndex: number, paragraphIndex: number): void {
    const textArray = this.getTextArray(sectionIndex);
    if (textArray.length > 1) {
      textArray.removeAt(paragraphIndex);
    }
  }

  onSubmit(): void {
    if (this.blogForm.invalid) {
      this.markFormGroupTouched(this.blogForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      // Sort sections by order before saving
      const formValues = { ...this.blogForm.value };

      // Process sections if they exist
      let formattedSections = [];
      if (formValues.sections && formValues.sections.length > 0) {
        // Sort sections
        formValues.sections = [...formValues.sections].sort(
          (a, b) => a.order - b.order
        );

        // Make sure each section has the correct structure
        formattedSections = formValues.sections.map((section: any) => {
          console.log('Processing section:', section);
          return {
            order: section.order,
            content: {
              title: section.content.title,
              text: Array.isArray(section.content.text)
                ? section.content.text
                : [section.content.text],
              imageUrl: section.imageUrl || '',
              imageCaption: section.imageCaption || '',
            },
          };
        });
      }

      // Get category name based on _id
      const categoryId = formValues.category._id;
      let categoryName = '';

      // Map category ID to name
      switch (categoryId) {
        case 'tin-tuc':
          categoryName = 'Tin tức';
          break;
        case 'meo-nau-an':
          categoryName = 'Mẹo nấu ăn';
          break;
        case 'mon-ngon':
          categoryName = 'Món ngon';
          break;
        default:
          categoryName = categoryId; // Fallback to ID if no mapping found
      }

      // Prepare the blog data
      const newBlog: Partial<Blog> = {
        title: formValues.title,
        slug: formValues.slug,
        description: formValues.description,
        thumbnail: formValues.thumbnail,
        author: formValues.author,
        category: {
          name: categoryName,
          _id: formValues.category._id,
        },
        publishDate: formValues.publishDate || new Date().toISOString(),
        sections: formattedSections,
        views: 0,
        likes: 0,
        likedBy: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Log the complete data structure
      console.log('Form values:', formValues);
      console.log('Formatted sections:', formattedSections);
      console.log('Final blog data:', JSON.stringify(newBlog, null, 2));

      this.blogService.createBlog(newBlog as Blog).subscribe(
        (response) => {
          console.log('Blog created successfully:', response);
          this.isSubmitting = false;
          this.successMessage = 'Blog đã được tạo thành công!';
          setTimeout(() => {
            this.router.navigate(['/blog']);
          }, 2000);
        },
        (error) => {
          console.error('Error creating blog:', error);
          this.errorMessage =
            'Không thể tạo blog. Vui lòng thử lại sau. Lỗi: ' + error;
          this.isSubmitting = false;
        }
      );
    } catch (err) {
      console.error('Error preparing blog data:', err);
      this.errorMessage =
        'Có lỗi xảy ra khi xử lý dữ liệu. Vui lòng thử lại sau.';
      this.isSubmitting = false;
    }
  }

  // Helper to mark all fields as touched to trigger validation
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach((group) => {
          if (group instanceof FormGroup) {
            this.markFormGroupTouched(group);
          }
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  // Generate slug from title
  generateSlug(): void {
    const title = this.blogForm.get('title')?.value;
    if (title) {
      const slug = title
        .toLowerCase()
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      this.blogForm.get('slug')?.setValue(slug);
    }
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/blog']);
  }

  // File handling
  onFileSelected(event: Event, field: string): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for image compression
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Calculate new dimensions (max width 800px)
          let width = img.width;
          let height = img.height;
          if (width > 800) {
            height = (height * 800) / width;
            width = 800;
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to compressed JPEG
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);

          this.blogForm.get(field)?.setValue(compressedDataUrl);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  // Section image handling
  onSectionImageSelected(event: Event, sectionIndex: number): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for image compression
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Calculate new dimensions (max width 800px)
          let width = img.width;
          let height = img.height;
          if (width > 800) {
            height = (height * 800) / width;
            width = 800;
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to compressed JPEG
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);

          const sections = this.blogForm.get('sections') as FormArray;
          const section = sections.at(sectionIndex);
          section.get('imageUrl')?.setValue(compressedDataUrl);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
}
