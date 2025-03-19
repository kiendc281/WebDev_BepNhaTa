import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit {
  // Khởi tạo product với giá trị mặc định rỗng khi tạo mới
  product: any = {
    ingredientName: '',
    mainImage: '',
    subImage: [],
    level: 'Trung bình',
    time: '',
    discount: 0,
    pricePerPortion: {
      '2': 0,
      '4': 0,
    },
    description: '',
    notes: '',
    components: [],
    storage: '',
    expirationDate: '',
    tags: [],
    relatedProductIds: [],
    suggestedRecipeIds: [],
    region: '',
    category: '',
    status: 'Còn hàng',
  };

  isEdit: boolean = false;
  pendingChanges: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    // Kiểm tra nếu đang sửa sản phẩm hiện có
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEdit = true;
        this.loadProductDetails(params['id']);
      }
    });
  }

  loadProductDetails(id: string): void {
    this.isLoading = true;
    this.productService.getProductById(id).subscribe({
      next: (response) => {
        // Lấy dữ liệu của sản phẩm từ API
        const productData = response.data;

        // Đảm bảo cấu trúc dữ liệu khẩu phần đúng
        if (!productData.pricePerPortion) {
          productData.pricePerPortion = {
            '2': 0,
            '4': 0,
          };
        } else {
          const tempPricePerPortion = {
            '2': productData.pricePerPortion['2'] || 0,
            '4': productData.pricePerPortion['4'] || 0,
          };
          productData.pricePerPortion = tempPricePerPortion;
        }

        // Lấy số lượng từ portionQuantities
        if (productData.portionQuantities) {
          productData['quantity2'] = productData.portionQuantities['2'] || 0;
          productData['quantity4'] = productData.portionQuantities['4'] || 0;
        } else {
          productData['quantity2'] = 0;
          productData['quantity4'] = 0;
        }

        // Thiết lập trạng thái mặc định cho từng khẩu phần
        // Và cập nhật trạng thái dựa trên số lượng
        if (productData['quantity2'] === 0) {
          productData['status2'] = 'Hết hàng';
        } else if (!productData['status2']) {
          productData['status2'] = 'Còn hàng';
        }

        if (productData['quantity4'] === 0) {
          productData['status4'] = 'Hết hàng';
        } else if (!productData['status4']) {
          productData['status4'] = 'Còn hàng';
        }

        // Định dạng ngày hạn sử dụng nếu có
        if (productData.expirationDate) {
          // Đảm bảo expirationDate ở định dạng YYYY-MM-DD cho thẻ input type="date"
          const date = new Date(productData.expirationDate);
          if (!isNaN(date.getTime())) {
            productData.expirationDate = date.toISOString().split('T')[0];
          }
        }

        // Xử lý sản phẩm liên quan - đảm bảo là mảng các chuỗi ID
        if (productData.relatedProductIds) {
          if (Array.isArray(productData.relatedProductIds)) {
            // Nếu là mảng, chuyển đổi tất cả thành chuỗi ID
            productData.relatedProductIds = productData.relatedProductIds.map(
              (item: any) => {
                if (typeof item === 'object' && item !== null) {
                  // Nếu là object, lấy _id hoặc chuyển thành chuỗi
                  return item._id || JSON.stringify(item);
                }
                return String(item); // Đảm bảo là chuỗi
              }
            );
          } else if (typeof productData.relatedProductIds === 'object') {
            // Nếu là một object, khởi tạo mới thành mảng rỗng
            productData.relatedProductIds = [];
          }
        } else {
          // Nếu không có, khởi tạo mới
          productData.relatedProductIds = [];
        }

        // Đảm bảo các mảng khác có giá trị mặc định
        if (!productData.components) productData.components = [];
        if (!productData.tags) productData.tags = [];
        if (!productData.suggestedRecipeIds)
          productData.suggestedRecipeIds = [];

        this.product = productData;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Lỗi khi tải thông tin sản phẩm:', error);
        this.errorMessage =
          'Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.';
        this.isLoading = false;
      },
    });
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

  // Helper để xử lý dữ liệu sản phẩm trước khi gửi lên server
  prepareProductData(): any {
    // Tạo bản sao của sản phẩm để xóa các trường không cần thiết
    const productToSend = { ...this.product };

    // Cập nhật portionQuantities từ quantity2 và quantity4
    if (!productToSend.portionQuantities) {
      productToSend.portionQuantities = {};
    }
    productToSend.portionQuantities['2'] = productToSend['quantity2'] || 0;
    productToSend.portionQuantities['4'] = productToSend['quantity4'] || 0;

    // Đảm bảo expirationDate được xử lý đúng định dạng
    if (
      productToSend.expirationDate &&
      typeof productToSend.expirationDate === 'string'
    ) {
      productToSend.expirationDate = new Date(productToSend.expirationDate);
    }

    // Xóa các trường không cần thiết
    delete productToSend['quantity2'];
    delete productToSend['quantity4'];
    delete productToSend['status2'];
    delete productToSend['status4'];

    return productToSend;
  }

  createProduct(): void {
    this.isLoading = true;
    const productToSend = this.prepareProductData();

    this.productService.createProduct(productToSend).subscribe({
      next: (response) => {
        this.isLoading = false;
        alert('Tạo sản phẩm thành công!');
        this.router.navigate(['/san-pham']);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Lỗi khi tạo sản phẩm:', error);
        alert('Không thể tạo sản phẩm. Vui lòng thử lại sau.');
      },
    });
  }

  updateProduct(): void {
    this.isLoading = true;
    const productToSend = this.prepareProductData();

    this.productService
      .updateProduct(productToSend._id, productToSend)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          alert('Cập nhật sản phẩm thành công!');
          this.pendingChanges = false;
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Lỗi khi cập nhật sản phẩm:', error);
          alert('Không thể cập nhật sản phẩm. Vui lòng thử lại sau.');
        },
      });
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

  addTag(event: Event, inputElement: HTMLInputElement): void {
    event.preventDefault();
    if (inputElement && inputElement.value && inputElement.value.trim()) {
      const tagsArray = inputElement.value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      tagsArray.forEach((tag) => {
        if (!this.product.tags.includes(tag)) {
          this.product.tags.push(tag);
        }
      });

      // Clear the input
      inputElement.value = '';
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

  uploadImage(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      return;
    }

    const file = fileInput.files[0];
    if (file) {
      // TODO: Implement actual image upload to server
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target && e.target.result) {
          this.product.mainImage = e.target.result as string;
          this.pendingChanges = true;
        }
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
    const value = event.target?.textContent?.trim() || '';
    const numericValue = parseInt(value.replace(/\D/g, ''));

    if (!isNaN(numericValue)) {
      this.product.pricePerPortion[portion] = numericValue;
      this.pendingChanges = true;
    }
  }

  // Thêm phương thức để cập nhật mô tả từ WYSIWYG editor
  updateDescription(event: Event): void {
    const target = event.target as HTMLDivElement;
    if (target && target.innerHTML !== undefined) {
      this.product.description = target.innerHTML;
      this.pendingChanges = true;
    }
  }

  // Thêm các phương thức để điều khiển định dạng văn bản
  executeCommand(command: string, value?: string): void {
    document.execCommand(command, false, value || '');
  }

  // Phương thức này có thể được gọi từ template để áp dụng định dạng
  applyFormat(format: string, value?: string): void {
    this.executeCommand(format, value);
  }

  // Handle format block change from select element
  handleFormatBlockChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    if (selectElement && selectElement.value) {
      this.applyFormat('formatBlock', selectElement.value);
    }
  }

  // Xóa sản phẩm liên quan
  removeRelatedProduct(index: number): void {
    if (this.product.relatedProductIds) {
      this.product.relatedProductIds.splice(index, 1);
      this.pendingChanges = true;
    }
  }

  // Xóa công thức gợi ý
  removeSuggestedRecipe(index: number): void {
    this.product.suggestedRecipeIds.splice(index, 1);
    this.pendingChanges = true;
  }

  // Mở hộp thoại chọn sản phẩm liên quan
  openRelatedProductsDialog(): void {
    // Đảm bảo relatedProductIds là mảng chuỗi
    if (!Array.isArray(this.product.relatedProductIds)) {
      this.product.relatedProductIds = [];
    }

    // Chuyển đổi các phần tử thành chuỗi nếu cần
    this.product.relatedProductIds = this.product.relatedProductIds.map(
      (item: any) => {
        if (typeof item === 'object' && item !== null) {
          return item._id || JSON.stringify(item);
        }
        return String(item);
      }
    );

    // Tạm thời thêm ID mẫu cho testing
    const randomId = 'GNL' + Math.floor(Math.random() * 10);
    this.product.relatedProductIds.push(randomId);

    this.pendingChanges = true;

    // TODO: Triển khai hộp thoại chọn sản phẩm thực tế
    alert('Chức năng chọn sản phẩm liên quan đang được phát triển!');
  }

  // Mở hộp thoại chọn công thức gợi ý
  openSuggestedRecipesDialog(): void {
    // Đảm bảo suggestedRecipeIds là mảng
    if (!Array.isArray(this.product.suggestedRecipeIds)) {
      this.product.suggestedRecipeIds = [];
    }

    // Tạm thời thêm ID mẫu cho testing
    const randomId = 'recipe_' + Math.floor(Math.random() * 100);
    this.product.suggestedRecipeIds.push(randomId);
    this.pendingChanges = true;

    // TODO: Triển khai hộp thoại chọn công thức thực tế
    alert('Chức năng chọn công thức gợi ý đang được phát triển!');
  }

  // Phương thức cập nhật trạng thái dựa trên số lượng
  updateStatusBasedOnQuantity(portion: string): void {
    if (portion === '2') {
      if (this.product['quantity2'] === 0) {
        this.product['status2'] = 'Hết hàng';
      } else if (
        this.product['status2'] === 'Hết hàng' &&
        this.product['quantity2'] > 0
      ) {
        // Nếu số lượng > 0 và đang là 'Hết hàng', chuyển lại thành 'Còn hàng'
        this.product['status2'] = 'Còn hàng';
      }
    } else if (portion === '4') {
      if (this.product['quantity4'] === 0) {
        this.product['status4'] = 'Hết hàng';
      } else if (
        this.product['status4'] === 'Hết hàng' &&
        this.product['quantity4'] > 0
      ) {
        // Nếu số lượng > 0 và đang là 'Hết hàng', chuyển lại thành 'Còn hàng'
        this.product['status4'] = 'Còn hàng';
      }
    }
    this.pendingChanges = true;
  }
}
