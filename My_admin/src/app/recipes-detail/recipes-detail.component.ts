import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-recipes-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './recipes-detail.component.html',
  styleUrls: ['./recipes-detail.component.css']
})
export class RecipesDetailComponent implements OnInit {
  // Khởi tạo recipe với giá trị mặc định rỗng khi tạo mới
  recipe: any = {
    _id: '',
    recipeName: '',
    recipeImage: '',
    servingsOptions: {
      '2': {
        ingredients: []
      },
      '4': {
        ingredients: []
      }
    },
    time: '',
    difficulty: 'Trung bình',
    description: '',
    notes: '',
    preparation: [],
    steps: [],
    servingSuggestion: '',
    tips: '',
    tags: [],
    likes: 0,
    region: '',
    category: ''
  };

  isEdit: boolean = false;
  pendingChanges: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Kiểm tra nếu đang sửa công thức hiện có
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEdit = true;
        this.loadRecipe(params['id']);
      }
    });
  }

  // Tải thông tin công thức
  loadRecipe(id: string): void {
    this.isLoading = true;
    // Giả lập tải dữ liệu
    setTimeout(() => {
      // Mẫu dữ liệu công thức
      this.recipe = {
        _id: "CT01",
        recipeName: "Phở bò",
        recipeImage: "https://res.cloudinary.com/dpfsn7dkf/image/upload/v1741233430/phobohanoi_huh3fe.jpg",
        servingsOptions: {
          "2": {
            ingredients: [
              { name: "Xương bò", quantity: "500g" },
              { name: "Thịt bò (thăn hoặc nạm)", quantity: "200g" },
              { name: "Bánh phở", quantity: "400g" },
              { name: "Gừng", quantity: "1 củ nhỏ" },
              { name: "Hành tây", quantity: "1/2 củ" },
              { name: "Hành lá", quantity: "1 ít" },
              { name: "Rau mùi", quantity: "1 ít" },
              { name: "Quế", quantity: "1 thanh nhỏ" },
              { name: "Hồi", quantity: "2 hoa" },
              { name: "Nước mắm", quantity: "1 muỗng canh" },
              { name: "Muối", quantity: "1 muỗng cà phê" },
              { name: "Đường", quantity: "1 muỗng cà phê" },
              { name: "Tiêu", quantity: "1/2 muỗng cà phê" }
            ]
          },
          "4": {
            ingredients: [
              { name: "Xương bò", quantity: "1kg" },
              { name: "Thịt bò (thăn hoặc nạm)", quantity: "400g" },
              { name: "Bánh phở", quantity: "800g" },
              { name: "Gừng", quantity: "1 củ vừa" },
              { name: "Hành tây", quantity: "1 củ" },
              { name: "Hành lá", quantity: "1 ít" },
              { name: "Rau mùi", quantity: "1 ít" },
              { name: "Quế", quantity: "2 thanh nhỏ" },
              { name: "Hồi", quantity: "4 hoa" },
              { name: "Nước mắm", quantity: "2 muỗng canh" },
              { name: "Muối", quantity: "2 muỗng cà phê" },
              { name: "Đường", quantity: "2 muỗng cà phê" },
              { name: "Tiêu", quantity: "1 muỗng cà phê" }
            ]
          }
        },
        time: "3 giờ",
        difficulty: "Trung bình",
        description: "Phở bò là món ăn truyền thống của Việt Nam, nổi tiếng với nước dùng thơm ngon và thịt bò mềm.",
        notes: "Nên hầm xương lâu để nước dùng ngọt tự nhiên.",
        preparation: [
          "Rửa sạch xương bò bằng nước muối loãng, sau đó chần qua nước sôi khoảng 5 phút để loại bỏ bọt bẩn và mùi tanh.",
          "Nướng gừng và hành tây trực tiếp trên lửa hoặc trong lò nướng cho đến khi cháy xém vỏ ngoài, sau đó cạo sạch vỏ cháy và rửa lại.",
          "Thái mỏng thịt bò (thăn hoặc nạm) thành từng lát mỏng, để riêng trên đĩa sạch.",
          "Rửa sạch hành lá và rau mùi, cắt nhỏ hành lá, để rau mùi nguyên cọng hoặc cắt khúc tùy ý.",
          "Chuẩn bị bánh phở: Nếu dùng bánh phở khô thì ngâm nước ấm khoảng 20 phút rồi vớt ra để ráo, nếu dùng bánh phở tươi thì chỉ cần rửa qua nước ấm.",
          "Rang nhẹ quế và hồi trên chảo nóng (không dầu) khoảng 1-2 phút cho dậy mùi thơm."
        ],
        steps: [
          "Cho xương bò vào nồi lớn, đổ 2 lít nước (cho 2 người) hoặc 4 lít nước (cho 4 người), đun sôi rồi hạ lửa nhỏ, hầm trong 2-3 giờ, thường xuyên vớt bọt để nước dùng trong.",
          "Sau 1 giờ hầm, thêm gừng nướng, hành tây nướng, quế và hồi đã rang vào nồi, tiếp tục hầm để nước dùng thơm.",
          "Nêm nước dùng với nước mắm, muối, đường và tiêu, điều chỉnh gia vị cho vừa miệng, đun thêm 10 phút để gia vị thấm đều.",
          "Trụng bánh phở qua nước sôi khoảng 30 giây, sau đó cho vào tô.",
          "Xếp thịt bò thái mỏng lên trên bánh phở, nếu thích thịt chín thì trụng sơ qua nước dùng trước khi xếp.",
          "Đun sôi nước dùng một lần nữa, sau đó chan nóng trực tiếp vào tô phở sao cho ngập bánh phở và thịt bò, thịt sẽ chín tái nhờ nhiệt độ nước.",
          "Rắc hành lá và rau mùi lên trên cùng, thêm một chút tiêu xay nếu thích."
        ],
        servingSuggestion: "Dùng nóng ngay sau khi chế biến, kèm theo đĩa rau sống (húng quế, giá đỗ, rau thơm), chanh tươi, ớt tươi, tương đen và tương ớt để chấm hoặc thêm tùy khẩu vị.",
        tips: "Nên chọn thịt bò tươi và thái thật mỏng để thịt chín tái ngon hơn. Nếu nước dùng bị đục, có thể lọc qua vải mùng trước khi chan.",
        tags: ["phở", "món nước", "truyền thống", "bò"],
        likes: 0,
        region: "Bắc",
        category: "Nước"
      };
      this.isLoading = false;
    }, 1000);
  }

  // Xử lý khi có thay đổi trong form
  onInputChange(): void {
    this.pendingChanges = true;
  }

  // Thêm nguyên liệu mới cho khẩu phần 2 người
  addIngredient2(): void {
    if (!this.recipe.servingsOptions['2'].ingredients) {
      this.recipe.servingsOptions['2'].ingredients = [];
    }
    this.recipe.servingsOptions['2'].ingredients.push({ name: '', quantity: '' });
    this.onInputChange();
  }

  // Xóa nguyên liệu cho khẩu phần 2 người
  removeIngredient2(index: number): void {
    this.recipe.servingsOptions['2'].ingredients.splice(index, 1);
    this.onInputChange();
  }

  // Thêm nguyên liệu mới cho khẩu phần 4 người
  addIngredient4(): void {
    if (!this.recipe.servingsOptions['4'].ingredients) {
      this.recipe.servingsOptions['4'].ingredients = [];
    }
    this.recipe.servingsOptions['4'].ingredients.push({ name: '', quantity: '' });
    this.onInputChange();
  }

  // Xóa nguyên liệu cho khẩu phần 4 người
  removeIngredient4(index: number): void {
    this.recipe.servingsOptions['4'].ingredients.splice(index, 1);
    this.onInputChange();
  }

  // Thêm bước chuẩn bị mới
  addPreparation(): void {
    this.recipe.preparation.push('');
    this.onInputChange();
  }

  // Xóa bước chuẩn bị
  removePreparation(index: number): void {
    this.recipe.preparation.splice(index, 1);
    this.onInputChange();
  }

  // Thêm bước thực hiện mới
  addStep(): void {
    this.recipe.steps.push('');
    this.onInputChange();
  }

  // Xóa bước thực hiện
  removeStep(index: number): void {
    this.recipe.steps.splice(index, 1);
    this.onInputChange();
  }

  // Xử lý tải ảnh
  uploadImage(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Giả lập tải ảnh lên
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.recipe.recipeImage = e.target.result;
        this.onInputChange();
      };
      reader.readAsDataURL(file);
    }
  }

  // Kích hoạt input file
  triggerFileInput(): void {
    document.getElementById('recipe-image')?.click();
  }

  // Thêm tag
  addTag(event: Event, tagInput: HTMLInputElement): void {
    event.preventDefault();
    const tagValue = tagInput.value.trim();
    
    if (tagValue) {
      // Nếu có dấu phẩy, tách thành nhiều tag
      const tags = tagValue.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      tags.forEach(tag => {
        if (!this.recipe.tags.includes(tag)) {
          this.recipe.tags.push(tag);
        }
      });
      
      tagInput.value = '';
      this.onInputChange();
    }
  }

  // Xóa tag
  removeTag(tag: string): void {
    const index = this.recipe.tags.indexOf(tag);
    if (index !== -1) {
      this.recipe.tags.splice(index, 1);
      this.onInputChange();
    }
  }

  // Lưu công thức
  saveRecipe(): void {
    this.isLoading = true;
    
    // Giả lập lưu dữ liệu
    setTimeout(() => {
      this.isLoading = false;
      this.pendingChanges = false;
      this.router.navigate(['/recipes']);
    }, 1000);
  }

  // Hủy và quay lại
  cancel(): void {
    if (this.pendingChanges) {
      if (confirm('Bạn có chắc muốn hủy các thay đổi?')) {
        this.router.navigate(['/recipes']);
      }
    } else {
      this.router.navigate(['/recipes']);
    }
  }
}
