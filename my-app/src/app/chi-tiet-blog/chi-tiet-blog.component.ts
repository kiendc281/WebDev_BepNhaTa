import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BlogService } from '../services/blog.service';
import { BlogPost, BlogSection } from '../models/blog.interface';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-chi-tiet-blog',
  standalone: true,
  imports: [CommonModule, RouterLink, HttpClientModule],
  templateUrl: './chi-tiet-blog.component.html',
  styleUrls: ['./chi-tiet-blog.component.css'],
  providers: [BlogService]
})
export class ChiTietBlogComponent implements OnInit {
  blogPost: BlogPost | undefined;
  relatedPosts: BlogPost[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blogService: BlogService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadBlogPost(id);
      } else {
        this.error = 'Không tìm thấy bài viết';
        this.loading = false;
      }
    });
  }

  loadBlogPost(id: string): void {
    this.loading = true;
    this.error = null;

    this.blogService.getBlogById(id).subscribe({
      next: (post) => {
        console.log('Blog Post received from API:', post);
        if (post) {
          this.blogPost = post;
          console.log('Blog Post after assignment:', this.blogPost);
          
          // Check if we should use structured sections or direct content
          if (!this.blogPost.sections || this.blogPost.sections.length === 0) {
            // Ensure we have content if sections are not available
            if (!this.blogPost.content) {
              this.blogPost.content = '<p>Bài viết này không có nội dung.</p>';
            }
          } else {
            console.log('Blog sections:', this.blogPost.sections);
          }
          
          // Load related blog posts
          this.loadRelatedPosts(id);
        } else {
          this.error = 'Không tìm thấy bài viết';
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Lỗi khi tải bài viết:', err);
        this.error = 'Không thể tải dữ liệu bài viết. Vui lòng thử lại sau.';
        this.loading = false;
        
        // Fallback sample data
        this.loadSampleData();
      }
    });
  }

  loadRelatedPosts(currentPostId: string): void {
    this.blogService.getBlogs().subscribe({
      next: (blogs) => {
        // Get up to 3 related posts (excluding current)
        this.relatedPosts = blogs
          .filter(blog => blog._id !== currentPostId)
          .slice(0, 3);
        this.loading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải bài viết liên quan:', err);
        this.loading = false;
      }
    });
  }

  // Fallback data if API fails
  loadSampleData(): void {
    this.blogPost = {
      _id: 'sample-1',
      title: 'Bắt mí bạn 3 cách chế biến cá hồi giúp nguyên định dưỡng tự nhiên',
      slug: 'bat-mi-ban-3-cach-che-bien-ca-hoi',
      category: {
        name: 'Đặc sản vùng miền',
        slug: 'dac-san-vung-mien'
      },
      author: {
        _id: 'sample-author',
        name: 'Bếp Nhà Ta',
        email: 'info@bepnhata.com'
      },
      views: 1764,
      likes: 246,
      likedBy: [],
      description: 'Cá hồi là loại thực phẩm vô cùng giàu dưỡng chất để dùng cải thiện chúng công chế chế biến thành nhiều món ngon khiến bạn giật mình thèm ăn.',
      content: `<p>Cá hồi là loại thực phẩm vô cùng giàu dưỡng chất để dùng cải thiện chúng ta có thể chế biến thành nhiều món ngon khiến bạn giật mình thèm ăn.</p>
      <h3>Lợi ích của cá hồi đối với sức khỏe</h3>
      <p>Cá hồi giàu axit béo omega-3, protein, vitamin D và các khoáng chất thiết yếu khác. Một khẩu phần cá hồi 100 gram cung cấp khoảng 25 gram protein, axit béo omega-3, vitamin D, B12, B3...Việc ăn cá hồi đều đặn sẽ giúp ngăn ngừa bệnh tim, đột quỵ, tiểu đường, hỗ trợ giảm viêm, cải thiện sức khỏe não bộ và mắt.</p>
      <h3>Cá hồi tươi có dùng được gì? Giá trị dinh dưỡng của cá hồi?</h3>
      <p>Cá hồi tươi giàu axit béo omega-3, protein, vitamin D và các khoáng chất thiết yếu. Một khẩu phần cá hồi 100 gram cung cấp khoảng 25 gram protein, axit béo omega-3, vitamin D, B12, B3. Một khẩu phần cá hồi (100g) có chu Selen không chỉ là chất chống oxy hóa mạnh mẽ mà còn có thể làm giảm nguy cơ một số bệnh ung thư, bảo vệ chức năng tuyến giáp và tăng cường hệ miễn dịch. Ngoài ra, cá hồi còn làm giảm các yếu tố nguy cơ mắc bệnh tim mạch, cải thiện sức khỏe não bộ và giúp kiểm soát trọng lượng.</p>
      <h3>Mách bạn 3 cách chế biến cá hồi ngon</h3>
      <h4>Phi lê cá hồi nướng</h4>
      <p>Món cá hồi nướng trên mâm nối là giải pháp phải thử nhanh cho việc diễng của món ăn. Bạn tẩm ướt thịt cá hồi với dầu oliu, hạt tiêu và giã tỏi vào lúc hàu. Bạn thịt môi mềm của tôi thì mà hải sản trên vỉ nướng, móc món ăn này chỉ để bạn đợi mạng từ 5 - 6 phút, thịt vẫn mềm, thơm nhẹ nhàng. Thịt mềm, bạn lại gây học ngoéo chay mướng, nếu có hồi tươi sắn cho món ăn lại càng đợt ý hướng mặt. Sau đó, thịch bắt từ lò nướng, nướng và những lát phẳng để phần kí 120 ° C (thịch thèm tới thấy mềm mà cảm thịch trong lòng nhé, nên làm lơ rằng).</p>
      <p><img src="/assets/images/ca-hoi.jpg" alt="Phi lê cá hồi nướng" /></p>
      <h4>Phi lê cá hồi nướng</h4>
      <p>Món cá hồi nướng trên mâm nối là giải pháp phải thử nhanh cho việc diễng của món ăn. Bạn tẩm ướt thịt cá hồi với dầu oliu, hạt tiêu và giã tỏi vào lúc hàu. Bạn thịt môi mềm của tôi thì mà hải sản trên vỉ nướng, móc món ăn này chỉ để bạn đợi mạng từ 5 - 6 phút, thịt vẫn mềm, thơm nhẹ nhàng. Thịt mềm, bạn lại gây học ngoéo chay mướng, nếu có hồi tươi sắn cho món ăn lại càng đợt ý hướng mặt. Sau đó, thịch bắt từ lò nướng, nướng và những lát phẳng để phần kí 120 ° C (thịch thèm tới thấy mềm mà cảm thịch trong lòng nhé, nên làm lơ rằng).</p>
      <p><img src="/assets/images/ca-hoi.jpg" alt="Phi lê cá hồi nướng" /></p>
      <h4>Phi lê cá hồi nướng</h4>
      <p>Món cá hồi nướng trên mâm nối là giải pháp phải thử nhanh cho việc diễng của món ăn. Bạn tẩm ướt thịt cá hồi với dầu oliu, hạt tiêu và giã tỏi vào lúc hàu. Bạn thịt môi mềm của tôi thì mà hải sản trên vỉ nướng, móc món ăn này chỉ để bạn đợi mạng từ 5 - 6 phút, thịt vẫn mềm, thơm nhẹ nhàng. Thịt mềm, bạn lại gây học ngoéo chay mướng, nếu có hồi tươi sắn cho món ăn lại càng đợt ý hướng mặt. Sau đó, thịch bắt từ lò nướng, nướng và những lát phẳng để phần kí 120 ° C (thịch thèm tới thấy mềm mà cảm thịch trong lòng nhé, nên làm lơ rằng).</p>
      <p><img src="/assets/images/ca-hoi.jpg" alt="Phi lê cá hồi nướng" /></p>`,
      thumbnail: 'assets/images/ca-hoi.jpg',
      publishDate: '2025-02-21T00:00:00.000Z',
      createdAt: '2025-02-21T00:00:00.000Z',
      updatedAt: '2025-02-21T00:00:00.000Z',
      saved: false
    };

    // Sample related posts
    this.relatedPosts = [
      {
        _id: 'sample-2',
        title: 'Cách làm phở bò truyền thống đúng vị Hà Nội',
        slug: 'cach-lam-pho-bo-truyen-thong',
        category: {
          name: 'Đặc sản vùng miền',
          slug: 'dac-san-vung-mien'
        },
        author: {
          _id: 'sample-author',
          name: 'Bếp Nhà Ta',
          email: 'info@bepnhata.com'
        },
        views: 1255,
        likes: 158,
        likedBy: [],
        description: 'Phở bò Hà Nội nổi tiếng với nước dùng trong ngọt và thơm mùi thảo mộc...',
        thumbnail: 'assets/images/popular-3.jpg',
        publishDate: '2025-02-15T00:00:00.000Z',
        createdAt: '2025-02-15T00:00:00.000Z',
        updatedAt: '2025-02-15T00:00:00.000Z',
        saved: false
      },
      {
        _id: 'sample-3',
        title: 'Bí quyết làm gỏi cuốn tôm thịt dai giòn',
        slug: 'bi-quyet-lam-goi-cuon-tom-thit',
        category: {
          name: 'Món ngon hàng ngày',
          slug: 'mon-ngon-hang-ngay'
        },
        author: {
          _id: 'sample-author',
          name: 'Bếp Nhà Ta',
          email: 'info@bepnhata.com'
        },
        views: 982,
        likes: 112,
        likedBy: [],
        description: 'Gỏi cuốn là món ăn thanh mát, dễ làm và cực kỳ được yêu thích...',
        thumbnail: 'assets/images/popular-2.jpg',
        publishDate: '2025-02-10T00:00:00.000Z',
        createdAt: '2025-02-10T00:00:00.000Z',
        updatedAt: '2025-02-10T00:00:00.000Z',
        saved: false
      }
    ];
  }

  likePost(): void {
    if (this.blogPost) {
      this.blogPost.likes += 1;
      // Call API to update likes in real app
      console.log('Đã thích bài viết');
    }
  }

  savePost(): void {
    if (this.blogPost) {
      this.blogPost.saved = !this.blogPost.saved;
      console.log(this.blogPost.saved ? 'Đã lưu bài viết' : 'Đã bỏ lưu bài viết');
    }
  }

  // Helper method to sort sections by order
  sortSections(sections: BlogSection[]): BlogSection[] {
    if (!sections) return [];
    return [...sections].sort((a, b) => a.order - b.order);
  }

  // Kiểm tra nếu một đối tượng là mảng
  isArray(obj: any): boolean {
    return Array.isArray(obj);
  }

  // Trả về mảng string an toàn cho ngFor
  getTextArray(text: string | string[]): string[] {
    if (Array.isArray(text)) {
      return text;
    }
    return [];
  }
}
