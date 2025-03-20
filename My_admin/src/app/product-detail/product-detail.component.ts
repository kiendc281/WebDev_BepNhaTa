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
  styleUrls: ['./product-detail.component.css'],
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
    this.errorMessage = '';

    this.productService.getProductById(id).subscribe({
      next: (response) => {
        // Lấy dữ liệu của sản phẩm từ API
        const productData = response.data;

        // Log dữ liệu gốc để kiểm tra cấu trúc
        console.log('Dữ liệu sản phẩm gốc từ server:', productData);
        console.log('Cấu trúc pricePerPortion:', productData.pricePerPortion);
        console.log(
          'Cấu trúc portionQuantities:',
          productData['portionQuantities']
        );

        // Lưu trữ dữ liệu pricePerPortion gốc
        productData['originalPricePerPortion'] = [];

        // Xử lý pricePerPortion dựa vào cấu trúc thực tế
        if (Array.isArray(productData.pricePerPortion)) {
          // Nếu là mảng (như trong ảnh chụp màn hình)
          console.log('pricePerPortion là một mảng, đang xử lý...');

          // Sao chép mảng gốc để lưu trữ
          productData['originalPricePerPortion'] = JSON.parse(
            JSON.stringify(productData.pricePerPortion)
          );

          // Tạo object cho binding trong form
          const priceObj: { [key: string]: number } = {};

          // Xử lý từng mục trong mảng
          productData.pricePerPortion.forEach((item: any) => {
            if (item.portion) {
              console.log(
                `Xử lý khẩu phần ${item.portion}: giá=${item.price}, số lượng=${item.quantity}`
              );

              // Lưu giá và tạo trường quantity cho form
              priceObj[item.portion] = Number(item.price) || 0;

              // Tạo trường quantity và status cho form
              productData[`quantity${item.portion}`] =
                Number(item.quantity) || 0;

              // Tạo trường status cho form
              productData[`status${item.portion}`] =
                Number(item.quantity) > 0 ? 'Còn hàng' : 'Hết hàng';
            }
          });

          // Ghi đè pricePerPortion bằng object mới cho form binding
          productData.pricePerPortion = priceObj;
        } else if (
          typeof productData.pricePerPortion === 'object' &&
          productData.pricePerPortion !== null
        ) {
          // Nếu là object (không phải mảng)
          console.log('pricePerPortion là một object, đang xử lý...');

          // Xử lý trường hợp đặc biệt nếu là object
          const portions = Object.keys(productData.pricePerPortion);

          // Tạo mảng originalPricePerPortion từ object
          portions.forEach((portion) => {
            // Tìm quantity tương ứng (nếu có)
            let quantity = 0;

            // Ưu tiên dùng portionQuantities nếu có
            if (
              productData['portionQuantities'] &&
              typeof productData['portionQuantities'] === 'object' &&
              productData['portionQuantities'][portion] !== undefined
            ) {
              quantity = Number(productData['portionQuantities'][portion]) || 0;
              console.log(
                `Lấy số lượng từ portionQuantities[${portion}]: ${quantity}`
              );
            } else if (productData[`quantity${portion}`] !== undefined) {
              quantity = Number(productData[`quantity${portion}`]) || 0;
              console.log(`Lấy số lượng từ quantity${portion}: ${quantity}`);
            }

            productData['originalPricePerPortion'].push({
              portion: portion,
              price: productData.pricePerPortion[portion],
              quantity: quantity,
            });

            // Đặt số lượng từ portionQuantities nếu có
            if (
              productData['portionQuantities'] &&
              typeof productData['portionQuantities'] === 'object' &&
              productData['portionQuantities'][portion] !== undefined
            ) {
              productData[`quantity${portion}`] =
                Number(productData['portionQuantities'][portion]) || 0;
              productData[`status${portion}`] =
                Number(productData['portionQuantities'][portion]) > 0
                  ? 'Còn hàng'
                  : 'Hết hàng';
              console.log(
                `Đặt quantity${portion}=${
                  productData[`quantity${portion}`]
                } từ portionQuantities`
              );
            } else {
              // Đảm bảo các trường quantity được thiết lập
              if (productData[`quantity${portion}`] === undefined) {
                productData[`quantity${portion}`] = 0;
                productData[`status${portion}`] = 'Hết hàng';
                console.log(`Khởi tạo quantity${portion}=0 (mặc định)`);
              }
            }
          });
        } else {
          // Nếu không có dữ liệu pricePerPortion, tạo mặc định
          console.log('Không tìm thấy pricePerPortion hợp lệ, tạo mặc định');

          productData.pricePerPortion = {
            '2': 0,
            '4': 0,
          };

          // Kiểm tra và lấy số lượng từ portionQuantities nếu có
          if (
            productData['portionQuantities'] &&
            typeof productData['portionQuantities'] === 'object'
          ) {
            productData['quantity2'] =
              Number(productData['portionQuantities']['2']) || 0;
            productData['quantity4'] =
              Number(productData['portionQuantities']['4']) || 0;
            productData['status2'] =
              Number(productData['portionQuantities']['2']) > 0
                ? 'Còn hàng'
                : 'Hết hàng';
            productData['status4'] =
              Number(productData['portionQuantities']['4']) > 0
                ? 'Còn hàng'
                : 'Hết hàng';
            console.log(
              `Đặt số lượng từ portionQuantities: quantity2=${productData['quantity2']}, quantity4=${productData['quantity4']}`
            );
          } else {
            productData['quantity2'] = 0;
            productData['quantity4'] = 0;
            productData['status2'] = 'Hết hàng';
            productData['status4'] = 'Hết hàng';
            console.log('Khởi tạo số lượng mặc định 0');
          }
        }

        console.log('Dữ liệu sau khi xử lý:', {
          pricePerPortion: productData.pricePerPortion,
          quantity2: productData['quantity2'],
          quantity4: productData['quantity4'],
          originalPricePerPortion: productData['originalPricePerPortion'],
        });

        // Định dạng ngày hạn sử dụng nếu có
        if (productData.expirationDate) {
          // Chuyển đổi và format ngày tháng cho phù hợp với UI
          const expirationDate = new Date(productData.expirationDate);
          if (!isNaN(expirationDate.getTime())) {
            // Đảm bảo định dạng YYYY-MM-DD cho input type="date"
            productData.expirationDate = expirationDate
              .toISOString()
              .split('T')[0];
          }
        }

        // Đảm bảo các mảng thuộc tính tồn tại
        productData.components = Array.isArray(productData.components)
          ? productData.components
          : [];
        productData.tags = Array.isArray(productData.tags)
          ? productData.tags
          : [];

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

    console.log('Dữ liệu sản phẩm trước khi gửi:', productToSend);
    console.log(
      'originalPricePerPortion:',
      productToSend['originalPricePerPortion']
    );

    // Kiểm tra cấu trúc pricePerPortion hiện tại
    console.log('pricePerPortion hiện tại:', productToSend.pricePerPortion);

    // Tạo mảng mới cho pricePerPortionArray
    let newPricePerPortionArray: any[] = [];

    // Nếu có mảng originalPricePerPortion, sử dụng nó để tạo mảng mới
    if (
      Array.isArray(productToSend['originalPricePerPortion']) &&
      productToSend['originalPricePerPortion'].length > 0
    ) {
      console.log('Sử dụng originalPricePerPortion để tạo mảng mới');

      // Sao chép mảng gốc để lưu trữ
      newPricePerPortionArray = JSON.parse(
        JSON.stringify(productToSend['originalPricePerPortion'])
      );

      // Cập nhật giá và số lượng từ form
      newPricePerPortionArray.forEach((item) => {
        if (item.portion) {
          // Cập nhật giá từ form
          item.price = Number(productToSend.pricePerPortion[item.portion]) || 0;

          // Cập nhật số lượng từ form
          item.quantity = Number(productToSend[`quantity${item.portion}`]) || 0;

          console.log(
            `Cập nhật khẩu phần ${item.portion}: giá=${item.price}, số lượng=${item.quantity}`
          );
        }
      });
    } else {
      // Nếu không có originalPricePerPortion, tạo mảng mới từ cấu trúc form
      console.log('Tạo mảng mới từ cấu trúc form');

      // Lấy các khẩu phần cần xử lý
      const portions = ['2', '4'];

      // Tạo mảng mới
      portions.forEach((portion) => {
        const price = Number(productToSend.pricePerPortion[portion]) || 0;
        const quantity = Number(productToSend[`quantity${portion}`]) || 0;

        console.log(
          `Tạo khẩu phần ${portion}: giá=${price}, số lượng=${quantity}`
        );

        newPricePerPortionArray.push({
          portion: portion,
          price: price,
          quantity: quantity,
        });
      });
    }

    // Ghi đè pricePerPortion bằng mảng mới
    productToSend.pricePerPortion = newPricePerPortionArray;

    // Log để kiểm tra
    console.log(
      'pricePerPortion trước khi gửi:',
      productToSend.pricePerPortion
    );

    // Cập nhật trạng thái chính của sản phẩm dựa trên tổng số lượng
    const totalQuantity = newPricePerPortionArray.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0
    );

    if (totalQuantity === 0) {
      productToSend.status = 'Hết hàng';
      console.log('-> Đặt trạng thái thành Hết hàng (tổng số lượng = 0)');
    } else {
      productToSend.status = 'Còn hàng';
      console.log('-> Đặt trạng thái thành Còn hàng (tổng số lượng > 0)');
    }

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
    delete productToSend['originalPricePerPortion'];

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

          // Sau khi cập nhật thành công, lưu thông tin vào localStorage để thông báo cần làm mới
          localStorage.setItem('productUpdated', 'true');

          // Chuyển hướng về trang danh sách sản phẩm
          this.router.navigate(['/san-pham']);
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

  // Phương thức cập nhật trạng thái dựa trên số lượng
  updateStatusBasedOnQuantity(portion: string): void {
    if (portion === '2') {
      // Chuyển đổi quantity2 sang số nguyên
      const quantity2 = parseInt(this.product['quantity2']) || 0;
      this.product['quantity2'] = quantity2;

      if (quantity2 === 0) {
        this.product['status2'] = 'Hết hàng';
      } else if (this.product['status2'] === 'Hết hàng' && quantity2 > 0) {
        // Nếu số lượng > 0 và đang là 'Hết hàng', chuyển lại thành 'Còn hàng'
        this.product['status2'] = 'Còn hàng';
      }
    } else if (portion === '4') {
      // Chuyển đổi quantity4 sang số nguyên
      const quantity4 = parseInt(this.product['quantity4']) || 0;
      this.product['quantity4'] = quantity4;

      if (quantity4 === 0) {
        this.product['status4'] = 'Hết hàng';
      } else if (this.product['status4'] === 'Hết hàng' && quantity4 > 0) {
        // Nếu số lượng > 0 và đang là 'Hết hàng', chuyển lại thành 'Còn hàng'
        this.product['status4'] = 'Còn hàng';
      }
    }
    this.pendingChanges = true;
  }
}
