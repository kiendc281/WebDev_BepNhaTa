import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit {
  product: any = {
    _id: 'GNL01',
    ingredientName: 'Gói nguyên liệu Phở bò',
    mainImage:
      'https://res.cloudinary.com/dpfsn7dkf/image/upload/v1741233430/phobohanoi_huh3fe.jpg',
    subImage: ['https://example.com/images/pho-bo-sub.jpg'],
    level: 'Trung bình',
    time: '30 phút',
    combo: 'Phở bò + Rau sống',
    discount: 10,
    pricePerPortion: {
      '2': 120000,
      '4': 230000,
    },
    description:
      'Gói nguyên liệu đầy đủ để nấu món Phở bò truyền thống, bao gồm xương bò, thịt bò, bánh phở và các loại gia vị đặc trưng.',
    notes:
      'Nên hầm xương lâu để nước dùng ngọt tự nhiên. Kiểm tra kỹ hạn sử dụng của từng thành phần trước khi chế biến.',
    components: [
      'Xương bò',
      'Thịt bò (thăn hoặc nạm)',
      'Bánh phở',
      'Gừng',
      'Hành tây',
      'Hành lá',
      'Rau mùi',
      'Quế',
      'Hồi',
      'Nước mắm',
      'Muối',
      'Đường',
      'Tiêu',
    ],
    storage:
      'Bảo quản xương bò và thịt bò ở ngăn đá (-18°C), bánh phở và gia vị ở nơi khô ráo, thoáng mát.',
    expirationDate: '2025-04-05',
    tags: ['phở', 'món nước', 'truyền thống', 'bò'],
    relatedProductIds: ['GNL02', 'GNL04'],
    suggestedRecipeIds: ['GNL03'],
    region: 'Bắc',
    category: 'Nước',
    quantity: 100,
    status: 'Còn hàng',
  };

  isEdit: boolean = false;
  pendingChanges: boolean = false;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    // Kiểm tra nếu đang sửa sản phẩm hiện có
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEdit = true;
        this.loadProductDetails(params['id']);
      }
    });
  }

  getPortions(): string[] {
    return Object.keys(this.product.pricePerPortion).sort(
      (a, b) => parseInt(a) - parseInt(b)
    );
  }

  loadProductDetails(id: string): void {
    // TODO: Gọi API để lấy thông tin sản phẩm
    console.log('Loading product details for ID:', id);

    // Giả lập dữ liệu từ API
    setTimeout(() => {
      // Dữ liệu mẫu cho testing
      if (id === 'GNL01') {
        // Đã có dữ liệu mẫu này được khởi tạo ở trên
        return;
      }

      // Các trường hợp ID khác
      this.product = {
        _id: id,
        ingredientName: 'Gà nướng lá chanh',
        mainImage: 'assets/images/product1.jpg',
        subImage: [
          'assets/images/product1_1.jpg',
          'assets/images/product1_2.jpg',
        ],
        level: 'Trung bình',
        time: '45 phút',
        combo: 'Combo lễ hội',
        discount: 10,
        pricePerPortion: {
          '2': 150000,
          '4': 280000,
        },
        description:
          'Gà nướng lá chanh là món ăn truyền thống với hương vị đặc trưng từ lá chanh và các loại gia vị.',
        notes: 'Nên ăn khi còn nóng để cảm nhận đầy đủ hương vị.',
        components: [
          'Thịt gà',
          'Lá chanh',
          'Sả',
          'Ớt',
          'Nghệ',
          'Nước mắm',
          'Đường',
        ],
        storage: 'Bảo quản trong tủ lạnh 2-5 độ C không quá 3 ngày',
        expirationDate: '2023-12-30',
        tags: ['Món nướng', 'Đặc sản'],
        relatedProductIds: ['SP002', 'SP003'],
        suggestedRecipeIds: ['R001', 'R002'],
        region: 'Trung',
        category: 'Món mặn',
        quantity: 50,
        status: 'Còn hàng',
      };
    }, 500);
  }

  saveProduct(): void {
    if (!this.validateForm()) {
      return;
    }

    if (this.isEdit) {
      this.updateProduct();
    } else {
      this.createProduct();
    }
  }

  validateForm(): boolean {
    // Validate các trường bắt buộc
    if (!this.product.ingredientName || !this.product.category) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return false;
    }
    return true;
  }

  createProduct(): void {
    // TODO: Gọi API để tạo sản phẩm mới
    console.log('Creating new product:', this.product);

    // Giả lập gọi API thành công
    setTimeout(() => {
      alert('Tạo sản phẩm thành công!');
      this.router.navigate(['/san-pham']);
    }, 1000);
  }

  updateProduct(): void {
    // TODO: Gọi API để cập nhật sản phẩm
    console.log('Updating product:', this.product);

    // Giả lập gọi API thành công
    setTimeout(() => {
      alert('Cập nhật sản phẩm thành công!');
      this.pendingChanges = false;
    }, 1000);
  }

  cancel(): void {
    if (this.pendingChanges) {
      const confirm = window.confirm(
        'Bạn có thay đổi chưa lưu. Bạn có chắc muốn thoát?'
      );
      if (!confirm) return;
    }
    this.router.navigate(['/san-pham']);
  }

  addComponent(): void {
    this.product.components.push('');
    this.pendingChanges = true;
  }

  removeComponent(index: number): void {
    this.product.components.splice(index, 1);
    this.pendingChanges = true;
  }

  addTag(event: Event, tagInput: HTMLInputElement): void {
    event.preventDefault();
    const value = tagInput.value.trim();

    if (value && !this.product.tags.includes(value)) {
      this.product.tags.push(value);
      tagInput.value = '';
      this.pendingChanges = true;
    }
  }

  removeTag(tag: string): void {
    const index = this.product.tags.indexOf(tag);
    if (index >= 0) {
      this.product.tags.splice(index, 1);
      this.pendingChanges = true;
    }
  }

  uploadImage(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // TODO: Implement actual image upload to server
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.product.mainImage = e.target.result;
        this.pendingChanges = true;
      };
      reader.readAsDataURL(file);
    }
  }

  onInputChange(): void {
    this.pendingChanges = true;
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById(
      'product-image'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  updatePricePerPortion(portion: string, event: any): void {
    const value = event.target.textContent.trim();
    const numericValue = parseInt(value.replace(/\D/g, ''));

    if (!isNaN(numericValue)) {
      this.product.pricePerPortion[portion] = numericValue;
      this.pendingChanges = true;
    }
  }

  addPricingRow(): void {
    // Xác định khẩu phần tiếp theo
    const portions = this.getPortions()
      .map((p) => parseInt(p))
      .sort((a, b) => a - b);

    const nextPortion =
      portions.length > 0 ? portions[portions.length - 1] + 2 : 2;
    this.product.pricePerPortion[nextPortion.toString()] = 0;

    this.pendingChanges = true;
  }
}
