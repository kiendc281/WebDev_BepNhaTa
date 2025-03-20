import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { RecipeService } from './recipe.service';
import { ProductService } from './product.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface SearchResult {
  recipes: any[];
  products: any[];
  blogs?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl = environment.apiUrl;
  
  constructor(
    private http: HttpClient,
    private recipeService: RecipeService,
    private productService: ProductService
  ) {}

  /**
   * Tìm kiếm theo từ khóa trên nhiều loại dữ liệu (công thức, sản phẩm, blog)
   */
  search(term: string): Observable<SearchResult> {
    // Nếu không có từ khóa, trả về kết quả rỗng
    if (!term || term.trim() === '') {
      return of({ recipes: [], products: [], blogs: [] });
    }

    // Chuẩn hóa từ khóa tìm kiếm (loại bỏ dấu, chuyển thành chữ thường)
    const normalizedTerm = this.normalizeText(term.trim());
    
    // Có thể thay thế bằng một API endpoint duy nhất trong tương lai
    const recipeSearch = this.recipeService.searchRecipes(term).pipe(
      map(recipes => {
        // Lọc thêm client-side để đảm bảo kết quả chính xác hơn
        return recipes.filter(recipe => {
          const normalizedName = this.normalizeText(recipe.recipeName);
          // Kiểm tra xem từ khóa có xuất hiện như một từ hoàn chỉnh hoặc đầu từ không
          return this.isRelevantMatch(normalizedName, normalizedTerm);
        });
      }),
      catchError(error => {
        console.error('Lỗi khi tìm kiếm công thức:', error);
        return of([]);
      })
    );

    const productSearch = this.productService.getProducts().pipe(
      map(products => {
        return products.filter(product => {
          const normalizedName = this.normalizeText(product.ingredientName);
          
          // Tách từ khóa và tên thành các từ để so sánh
          const nameWords = normalizedName.split(/\s+/);
          const termWords = normalizedTerm.split(/\s+/);
          
          // Ưu tiên tìm kiếm chính xác trong tên sản phẩm
          if (this.isRelevantMatch(normalizedName, normalizedTerm)) {
            return true;
          }
          
          // Kiểm tra từng từ trong từ khóa xem có xuất hiện như một từ
          // trong tên nguyên liệu hoặc mô tả không
          for (const termWord of termWords) {
            if (termWord.length < 2) continue; // Bỏ qua từ quá ngắn
            
            // Ưu tiên khớp từ đầu tiên hoặc từ có ý nghĩa
            if (
              nameWords.some(word => 
                // Khớp chính xác từ 
                word === termWord ||
                // Khớp đầu từ với từ khóa dài
                (termWord.length >= 3 && word.startsWith(termWord) && word.length <= termWord.length * 1.5)
              )
            ) {
              return true;
            }
          }
          
          // Kiểm tra mô tả - chỉ khi từ khóa có ít nhất 3 ký tự 
          // và xuất hiện rõ ràng trong mô tả
          if (product.description && normalizedTerm.length >= 3) {
            const normalizedDesc = this.normalizeText(product.description);
            const descWords = normalizedDesc.split(/\s+/);
            
            // Chỉ khớp nếu từ khóa xuất hiện như một từ độc lập trong mô tả
            for (const termWord of termWords) {
              if (termWord.length < 3) continue; // Bỏ qua từ quá ngắn
              
              if (descWords.some(word => 
                word === termWord || 
                (word.startsWith(termWord) && termWord.length >= 4)
              )) {
                return true;
              }
            }
          }
          
          return false;
        });
      }),
      catchError(error => {
        console.error('Lỗi khi tìm kiếm sản phẩm:', error);
        return of([]);
      })
    );

    // Có thể bổ sung tìm kiếm blog ở đây nếu cần

    return forkJoin({
      recipes: recipeSearch,
      products: productSearch,
      // blogs: blogSearch (nếu cần)
    }).pipe(
      catchError(error => {
        console.error('Lỗi khi kết hợp kết quả tìm kiếm:', error);
        return of({ recipes: [], products: [], blogs: [] });
      })
    );
  }

  /**
   * Chuẩn hóa văn bản để tìm kiếm (loại bỏ dấu, chữ thường)
   */
  private normalizeText(text: string): string {
    if (!text) return '';
    
    // Chuyển thành chữ thường
    let result = text.toLowerCase();
    
    // Loại bỏ dấu tiếng Việt
    result = result.normalize('NFD')
                   .replace(/[\u0300-\u036f]/g, '')
                   .replace(/đ/g, 'd')
                   .replace(/Đ/g, 'D');
    
    return result;
  }
  
  /**
   * Kiểm tra xem từ khóa có phải là match có giá trị không
   * Ví dụ: từ khóa "ca" nên match với "cá rô phi" nhưng không match với "thịt heo cắt lát"
   */
  private isRelevantMatch(text: string, keyword: string): boolean {
    // Nếu văn bản chính xác bằng từ khóa
    if (text === keyword) return true;
    
    // Tách từ khóa và văn bản thành các từ
    const words = text.split(/\s+/);
    const keywordWords = keyword.split(/\s+/);
    
    // Trường hợp từ khóa chỉ có một từ
    if (keywordWords.length === 1) {
      // Nếu từ khóa quá ngắn (1 ký tự), yêu cầu match chính xác từ
      if (keyword.length === 1) {
        return words.some(word => word === keyword);
      }
      
      // Kiểm tra xem từ khóa có là từ độc lập trong văn bản không
      for (const word of words) {
        // Đối với từ khóa ngắn (2-3 ký tự), yêu cầu match đúng từ hoặc đầu từ
        if (keyword.length <= 3) {
          // Chỉ khớp nếu là từ chính xác hoặc từ bắt đầu bằng từ khóa
          if (word === keyword || word === keyword + 's') return true;
          
          // Trường hợp từ ghép, chỉ match khi từ bắt đầu bằng từ khóa
          // Ví dụ: "bún" khớp với "bún thang" nhưng không khớp với "miến bún"
          if (word.startsWith(keyword + ' ') || word.startsWith(keyword + '-')) return true;
          continue;
        }
        
        // Nếu từ bằng từ khóa
        if (word === keyword) return true;
        
        // Nếu từ bắt đầu bằng từ khóa và độ dài từ khóa ít nhất là 85% độ dài từ
        // Tăng độ chính xác lên để loại bỏ các trường hợp không liên quan
        if (word.startsWith(keyword) && keyword.length >= word.length * 0.85) {
          return true;
        }
      }
      
      // Kiểm tra từ đầu tiên của nguyên liệu/món ăn
      // Nhiều món ăn Việt Nam thường bắt đầu bằng loại (phở, bún, cơm...)
      if (words.length > 0 && words[0] === keyword) {
        return true;
      }
      
      // Từ khóa đủ dài (từ 4 ký tự trở lên) có thể so sánh chứa từ khóa
      if (keyword.length >= 4) {
        // Duyệt qua từng từ để kiểm tra
        for (const word of words) {
          // Chỉ match khi từ bắt đầu bằng từ khóa
          if (word.startsWith(keyword)) {
            return true;
          }
        }
      }
      
      return false;
    } 
    // Trường hợp từ khóa có nhiều từ
    else {
      // Tính số từ trùng khớp
      let matchCount = 0;
      let totalWeight = 0;
      
      // Đặt trọng số cao hơn cho các từ đầu tiên trong từ khóa
      const weightMap = keywordWords.map((_, index) => {
        return 1 - (index * 0.1); // Từ đầu tiên có trọng số 1, giảm dần 0.1 cho từ tiếp theo
      });
      
      for (let i = 0; i < keywordWords.length; i++) {
        const keywordWord = keywordWords[i];
        const weight = weightMap[i];
        
        // Kiểm tra từng từ trong từ khóa
        let wordMatched = false;
        for (const word of words) {
          if (word === keywordWord || 
              (word.startsWith(keywordWord) && keywordWord.length >= word.length * 0.85)) {
            matchCount++;
            totalWeight += weight;
            wordMatched = true;
            break;
          }
        }
        
        // Nếu từ đầu tiên không khớp (trọng số cao nhất), loại bỏ kết quả
        if (i === 0 && !wordMatched) {
          return false;
        }
      }
      
      // Yêu cầu ít nhất 85% trọng số cho nhiều từ
      const totalPossibleWeight = weightMap.reduce((sum, w) => sum + w, 0);
      return totalWeight >= totalPossibleWeight * 0.85;
    }
  }

  /**
   * Tìm kiếm nhanh để hiển thị gợi ý, hạn chế số lượng kết quả
   */
  getSearchSuggestions(term: string, limit: number = 3): Observable<SearchResult> {
    return this.search(term).pipe(
      map(results => ({
        recipes: results.recipes ? results.recipes.slice(0, limit) : [],
        products: results.products ? results.products.slice(0, limit) : [],
        blogs: results.blogs ? results.blogs.slice(0, limit) : []
      }))
    );
  }
} 