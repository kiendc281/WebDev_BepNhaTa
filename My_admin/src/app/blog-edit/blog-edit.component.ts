import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BlogService } from '../services/blog.service';
import { AccountService } from '../services/account.service';
import { Blog } from '../models/blog.interface';
import { Account } from '../models/account.interface';

@Component({
  selector: 'app-blog-edit',
  templateUrl: './blog-edit.component.html',
  styleUrls: ['./blog-edit.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class BlogEditComponent implements OnInit {
  blogForm!: FormGroup;
  blogId: string = '';
  blog: Blog | null = null;
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isNewBlog: boolean = false;
  adminAccounts: Account[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private blogService: BlogService,
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadAdminAccounts();

    // Get blog ID from the route
    this.route.paramMap.subscribe((params) => {
      try {
        const id = params.get('id');
        if (id === 'add') {
          this.isNewBlog = true;
          this.initNewBlog();
        } else if (id) {
          this.blogId = id;
          this.loadBlog();
        } else {
          this.errorMessage = 'Không tìm thấy ID blog';
          this.router.navigate(['/blog']);
        }
      } catch (error) {
        console.error('Error in route processing:', error);
        this.errorMessage = 'Có lỗi xảy ra khi xử lý đường dẫn';
        this.router.navigate(['/blog']);
      }
    });
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
      publishDate: [''],
      sections: this.fb.array([]),
    });
  }

  private initNewBlog(): void {
    this.blog = {
      _id: '',
      title: '',
      slug: '',
      author: '',
      description: '',
      thumbnail: '',
      category: {
        _id: '',
        name: '',
      },
      views: 0,
      likes: 0,
      likedBy: [],
      sections: [],
      publishDate: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.patchFormValues();
    // Add an initial empty section
    this.addSection();
  }

  private loadBlog(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.blogService.getBlogById(this.blogId).subscribe(
      (blog) => {
        console.log('API response - Loaded blog:', blog);
        console.log('Category structure:', typeof blog.category, blog.category);

        if (!blog) {
          this.errorMessage = `Không tìm thấy blog với ID: ${this.blogId}`;
          this.isLoading = false;
          return;
        }

        // Deep copy blog để tránh thay đổi dữ liệu gốc
        this.blog = JSON.parse(JSON.stringify(blog));
        console.log('Blog data after copy:', this.blog);

        // Bảo vệ this.blog với kiểm tra null
        if (this.blog) {
          // Đảm bảo blog có đầy đủ các trường cần thiết
          if (!this.blog.category) {
            this.blog.category = { _id: '', name: '' };
          } else if (typeof this.blog.category === 'string') {
            // Nếu category là string ID thay vì object
            const categoryId = this.blog.category;
            this.blog.category = { _id: categoryId, name: '' };
          }

          // Đảm bảo author có định dạng đúng
          if (!this.blog.author) {
            this.blog.author = '';
          } else if (
            typeof this.blog.author === 'object' &&
            this.blog.author &&
            !this.blog.author._id
          ) {
            // Nếu author là object nhưng không có _id
            this.blog.author = '';
          }

          // Đảm bảo publishDate có định dạng đúng
          if (this.blog.publishDate) {
            try {
              const date = new Date(this.blog.publishDate);
              if (!isNaN(date.getTime())) {
                this.blog.publishDate = date.toISOString().split('T')[0];
              } else {
                this.blog.publishDate = '';
              }
            } catch (e) {
              console.error('Error parsing date:', e);
              this.blog.publishDate = '';
            }
          }
        }

        this.patchFormValues();
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading blog:', error);
        this.errorMessage =
          'Không thể tải thông tin blog. Vui lòng thử lại sau. Chi tiết lỗi: ' +
          error;
        this.isLoading = false;
      }
    );
  }

  private patchFormValues(): void {
    if (!this.blog) {
      console.warn('Blog is null, cannot patch form values');
      return;
    }

    console.log('Patching form with blog data:', this.blog);

    // Xử lý category
    let categoryId = '';
    let categoryName = '';

    if (this.blog.category) {
      console.log('Original category data:', this.blog.category);

      if (typeof this.blog.category === 'string') {
        categoryId = this.blog.category;
        console.log('Category is string:', categoryId);
      } else if (this.blog.category._id) {
        categoryId = this.blog.category._id;
        categoryName = this.blog.category.name || '';
        console.log(
          'Category is object with _id:',
          categoryId,
          'name:',
          categoryName
        );
      } else if (this.blog.category.name) {
        // Có thể server trả về chỉ tên danh mục mà không có ID
        categoryName = this.blog.category.name;

        // Map từ tên danh mục sang ID
        switch (categoryName.toLowerCase()) {
          case 'tin tức':
            categoryId = 'tin-tuc';
            break;
          case 'mẹo nấu ăn':
            categoryId = 'meo-nau-an';
            break;
          case 'món ngon':
            categoryId = 'mon-ngon';
            break;
          case 'món ngon mỗi ngày':
            categoryId = 'mon-ngon-moi-ngay';
            break;
          default:
            // Nếu không tìm thấy mapping, giữ nguyên giá trị
            categoryId = categoryName
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
              .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
              .replace(/[ìíịỉĩ]/g, 'i')
              .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
              .replace(/[ùúụủũưừứựửữ]/g, 'u')
              .replace(/[ỳýỵỷỹ]/g, 'y')
              .replace(/đ/g, 'd');
        }
        console.log(
          'Mapped category from name to ID:',
          categoryName,
          '->',
          categoryId
        );
      }

      // Log specific category value for debugging
      console.log('Category ID to be used in form:', categoryId);

      // Thêm log để kiểm tra các giá trị category hợp lệ
      console.log(
        'Valid category values in dropdown: tin-tuc, meo-nau-an, mon-ngon, mon-ngon-moi-ngay'
      );
    }

    // Xử lý author - cẩn thận với null/undefined
    let authorId = '';
    if (this.blog.author) {
      if (typeof this.blog.author === 'string') {
        authorId = this.blog.author;
      } else if (
        this.blog.author &&
        typeof this.blog.author === 'object' &&
        this.blog.author._id
      ) {
        authorId = this.blog.author._id;
      }
    }
    console.log('Author ID extracted:', authorId);

    // Xử lý publishDate
    const publishDate = this.blog.publishDate || '';

    // Patch form values
    const formValues = {
      title: this.blog.title || '',
      slug: this.blog.slug || '',
      author: authorId,
      description: this.blog.description || '',
      thumbnail: this.blog.thumbnail || '',
      category: {
        _id: categoryId,
        name: categoryName,
      },
      publishDate: publishDate,
    };

    console.log('Form values to patch:', formValues);
    this.blogForm.patchValue(formValues);

    // Kiểm tra xem form có cập nhật đúng không
    setTimeout(() => {
      console.log(
        'Category value after patching:',
        this.blogForm.get('category._id')?.value
      );
      console.log('Complete form value after patching:', this.blogForm.value);
    }, 0);

    // Initialize sections
    const sectionsArray = this.blogForm.get('sections') as FormArray;
    sectionsArray.clear();

    if (this.blog.sections && this.blog.sections.length > 0) {
      try {
        // Sort sections by order
        const sortedSections = [...this.blog.sections].sort(
          (a, b) => (a.order || 0) - (b.order || 0)
        );

        sortedSections.forEach((section) => {
          sectionsArray.push(this.createSectionFormGroup(section));
        });
      } catch (error) {
        console.error('Error processing sections:', error);
      }
    }
  }

  // Section management
  get sections() {
    return this.blogForm.get('sections') as FormArray;
  }

  createSectionFormGroup(section: any = null): FormGroup {
    console.log('Creating section form group with data:', section);

    // Kiểm tra section có tồn tại không
    if (!section) {
      // Trả về form group mặc định nếu không có section
      return this.fb.group({
        order: [this.sections.length + 1, Validators.required],
        _id: [''],
        content: this.fb.group({
          title: ['', Validators.required],
          text: this.fb.array([this.fb.control('', Validators.required)]),
        }),
        imageUrl: [''],
        imageCaption: [''],
      });
    }

    // Default empty content structure
    const defaultContent = {
      title: '',
      text: [''],
    };

    // Process section content based on structure
    let sectionContent = defaultContent;
    let sectionTexts = [''];

    try {
      if (section && section.content) {
        if (typeof section.content === 'object') {
          // Content is an object with title and text properties
          const title = section.content.title || '';

          // Handle text array
          if (Array.isArray(section.content.text)) {
            sectionTexts = section.content.text.map(
              (text: string) => text || ''
            );
          } else if (typeof section.content.text === 'string') {
            sectionTexts = [section.content.text];
          }

          sectionContent = {
            title: title,
            text: sectionTexts,
          };
        } else if (typeof section.content === 'string') {
          // Content is a simple string
          sectionContent = {
            title: section.title || '',
            text: [section.content],
          };
        }
      }
    } catch (e) {
      console.error('Error processing section content:', e);
      // Sử dụng giá trị mặc định nếu có lỗi
      sectionContent = defaultContent;
    }

    // Kiểm tra nếu sectionTexts rỗng hoặc không hợp lệ
    if (
      !sectionTexts ||
      !Array.isArray(sectionTexts) ||
      sectionTexts.length === 0
    ) {
      sectionTexts = [''];
    }

    // Ensure order is a valid number
    const order =
      section.order && !isNaN(parseInt(section.order))
        ? parseInt(section.order)
        : this.sections.length + 1;

    // Create form group with nested structure
    return this.fb.group({
      order: [order, Validators.required],
      _id: [section._id || ''],
      content: this.fb.group({
        title: [sectionContent.title || '', Validators.required],
        text: this.fb.array(
          sectionTexts.map((text) =>
            this.fb.control(text || '', Validators.required)
          )
        ),
      }),
      imageUrl: [section.imageUrl || section.image || ''],
      imageCaption: [section.imageCaption || ''],
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
      const updatedBlog: any = {
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
        updatedAt: new Date().toISOString(),
      };

      // Keep original values if they exist
      if (this.blog) {
        // Make sure we're using the original ID
        updatedBlog._id = this.blog._id;
        updatedBlog.createdAt = this.blog.createdAt;
        updatedBlog.views = this.blog.views || 0;
        updatedBlog.likes = this.blog.likes || 0;
        updatedBlog.likedBy = this.blog.likedBy || [];
      }

      console.log('Submitting blog data:', JSON.stringify(updatedBlog));

      if (this.isNewBlog) {
        // Create new blog
        this.blogService.createBlog(updatedBlog).subscribe(
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
      } else {
        // Update existing blog
        this.blogService.updateBlog(this.blogId, updatedBlog).subscribe(
          (response) => {
            console.log('Blog updated successfully:', response);
            this.isSubmitting = false;
            this.successMessage = 'Blog đã được cập nhật thành công!';
            setTimeout(() => {
              this.router.navigate(['/blog']);
            }, 2000);
          },
          (error) => {
            console.error('Error updating blog:', error);
            this.errorMessage =
              'Không thể cập nhật blog. Vui lòng thử lại sau. Lỗi: ' + error;
            this.isSubmitting = false;
          }
        );
      }
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
      // In a real implementation, you would upload the file to a server
      // and get back a URL to store in the form
      // For now, we'll just simulate this with a local URL
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.blogForm.get(field)?.setValue(reader.result as string);
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
      reader.onload = () => {
        const sections = this.blogForm.get('sections') as FormArray;
        const section = sections.at(sectionIndex);
        section.get('imageUrl')?.setValue(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  private loadAdminAccounts(): void {
    this.accountService.getAdminAccounts().subscribe(
      (accounts) => {
        this.adminAccounts = accounts;
        console.log('Loaded admin accounts:', this.adminAccounts);
      },
      (error) => {
        console.error('Error loading admin accounts:', error);
        this.errorMessage =
          'Không thể tải danh sách tác giả. Vui lòng thử lại sau.';
      }
    );
  }
}
