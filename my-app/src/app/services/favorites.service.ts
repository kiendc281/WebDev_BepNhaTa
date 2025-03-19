// src/app/services/favorites.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface FavoriteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}
  
  // Lấy accountId từ người dùng đăng nhập
  private getAccountId(): string | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.log('Không tìm thấy thông tin user trong localStorage');
      return null;
    }
    
    console.log('Raw user string from localStorage:', userStr);
    
    try {
      const user = JSON.parse(userStr);
      console.log('DEBUG - Parsed user object:', user);
      
      // Hiển thị tất cả các thuộc tính bậc 1 trong user object
      console.log('DEBUG - User top level properties:');
      for (const key in user) {
        console.log(`- ${key}: ${typeof user[key] === 'object' ? 'Object/Array' : user[key]}`);
      }
      
      // Xử lý nhiều trường hợp có thể có của cấu trúc user
      let accountId = null;
      
      // Trường hợp 1: _id hoặc id ở cấp cao nhất
      if (user._id) {
        accountId = user._id;
        console.log('Sử dụng _id từ cấp cao nhất:', accountId);
      } else if (user.id) {
        accountId = user.id;
        console.log('Sử dụng id từ cấp cao nhất:', accountId);
      }
      // Trường hợp 2: Nằm trong data.user
      else if (user.data && user.data.user && user.data.user._id) {
        accountId = user.data.user._id;
        console.log('Sử dụng data.user._id:', accountId);
      }
      // Trường hợp 3: Nằm trong data
      else if (user.data && user.data._id) {
        accountId = user.data._id;
        console.log('Sử dụng data._id:', accountId);
      }
      // Trường hợp 4: _id hoặc id nằm trong user.account hoặc user.user
      else if (user.user && user.user._id) {
        accountId = user.user._id;
        console.log('Sử dụng user._id:', accountId);
      } else if (user.user && user.user.id) {
        accountId = user.user.id;
        console.log('Sử dụng user.id:', accountId);
      } else if (user.account && user.account._id) {
        accountId = user.account._id;
        console.log('Sử dụng account._id:', accountId);
      } else if (user.account && user.account.id) {
        accountId = user.account.id;
        console.log('Sử dụng account.id:', accountId);
      }
      // Trường hợp 5: userId hoặc accountId
      else if (user.userId) {
        accountId = user.userId;
        console.log('Sử dụng userId:', accountId);
      } else if (user.accountId) {
        accountId = user.accountId;
        console.log('Sử dụng accountId:', accountId);
      }
      
      // In toàn bộ object user để debug
      console.log('Cấu trúc user đầy đủ:', JSON.stringify(user));
      
      if (!accountId) {
        console.error('Không tìm thấy accountId trong object user', user);
        return null;
      }
      
      // Kiểm tra định dạng AccountId
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(accountId)) {
        console.error('AccountId không đúng định dạng ObjectId:', accountId);
        
        // Nếu dùng accountId giả để test, bạn có thể hardcode ở đây
        const hardcodedId = '507f1f77bcf86cd799439011'; // ID giả hợp lệ để test
        console.log('Sử dụng hardcoded ID thay thế:', hardcodedId);
        return hardcodedId;
      }
      
      console.log('Final accountId being used:', accountId);
      return accountId;
    } catch (e) {
      console.error('Error parsing user data', e);
      return null;
    }
  }

  // Thêm vào yêu thích
  addToFavorites(targetId: string, type: string): Observable<any> {
    const accountId = this.getAccountId();
    if (!accountId) {
      console.error('Không có accountId, không thể thêm vào yêu thích');
      return of({ success: false, message: 'Vui lòng đăng nhập' });
    }
    
    if (!targetId) {
      console.error('targetId không được cung cấp');
      return of({ success: false, message: 'ID không hợp lệ' });
    }
    
    // Xử lý targetId cho blog
    let processedTargetId = targetId;
    if (type === 'blog') {
      // Nếu là ID ngắn (BLxx), chuyển về MongoDB ID
      const blogIdMap: { [key: string]: string } = {
        'BL01': '507f1f77bcf86cd799439011',
        'BL02': '507f1f77bcf86cd799439012',
        'BL03': '507f1f77bcf86cd799439013',
        'BL04': '507f1f77bcf86cd799439014',
        'BL05': '507f1f77bcf86cd799439015'
      };
      processedTargetId = blogIdMap[targetId] || targetId;
    }
    
    const data = {
      accountId,
      targetId: processedTargetId,
      type,
      createdAt: new Date().toISOString()
    };
    
    console.log('Đang gửi request thêm vào yêu thích:', data);
    
    // Xóa bài viết khỏi danh sách đã xóa trong localStorage (nếu có)
    try {
      let removedFavorites = JSON.parse(localStorage.getItem('removedFavorites') || '{}');
      if (removedFavorites[type] && removedFavorites[type].length > 0) {
        // Xóa cả ID gốc và ID đã xử lý
        removedFavorites[type] = removedFavorites[type].filter((id: string) => 
          id !== targetId && id !== processedTargetId
        );
        localStorage.setItem('removedFavorites', JSON.stringify(removedFavorites));
      }
    } catch (e) {
      console.error('Lỗi khi cập nhật danh sách đã xóa:', e);
    }
    
    return this.http.post(this.apiUrl + '/favorites', data).pipe(
      tap(response => console.log('Kết quả API thêm vào yêu thích:', response)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error adding to favorites:', error);
        console.error('Server response:', error.error);
        return of({ 
          success: false, 
          message: error.error?.message || 'Không thể thêm vào yêu thích',
          error: error.message
        });
      })
    );
  }

  // Xóa khỏi yêu thích
  removeFromFavorites(targetId: string, type: string): Observable<any> {
    const accountId = this.getAccountId();
    if (!accountId) {
      console.error('Không có accountId, không thể xóa khỏi yêu thích');
      return of({ success: false, message: 'Vui lòng đăng nhập' });
    }
    
    if (!targetId) {
      console.error('targetId không được cung cấp');
      return of({ success: false, message: 'ID không hợp lệ' });
    }
    
    // Xử lý targetId cho blog
    let processedTargetId = targetId;
    if (type === 'blog') {
      // Nếu là ID ngắn (BLxx), chuyển về MongoDB ID
      const blogIdMap: { [key: string]: string } = {
        'BL01': '507f1f77bcf86cd799439011',
        'BL02': '507f1f77bcf86cd799439012',
        'BL03': '507f1f77bcf86cd799439013',
        'BL04': '507f1f77bcf86cd799439014',
        'BL05': '507f1f77bcf86cd799439015'
      };
      processedTargetId = blogIdMap[targetId] || targetId;
    }
    
    console.log('Đang gửi request xóa khỏi yêu thích:', { accountId, targetId: processedTargetId, type });
    
    // Encode các tham số URL
    const encodedAccountId = encodeURIComponent(accountId);
    const encodedTargetId = encodeURIComponent(processedTargetId);
    const encodedType = encodeURIComponent(type);
    
    const url = `${this.apiUrl}/favorites?accountId=${encodedAccountId}&targetId=${encodedTargetId}&type=${encodedType}`;
    console.log('URL DELETE request:', url);
    
    return this.http.delete(url).pipe(
      tap(response => {
        console.log('Kết quả API xóa khỏi yêu thích:', response);
        
        // Cập nhật cache phía client
        try {
          let removedFavorites = JSON.parse(localStorage.getItem('removedFavorites') || '{}');
          if (!removedFavorites[type]) {
            removedFavorites[type] = [];
          }
          // Lưu cả ID ngắn và ID MongoDB để đảm bảo không bị trùng lặp
          if (type === 'blog') {
            const shortId = targetId;
            const mongoId = processedTargetId;
            if (!removedFavorites[type].includes(shortId)) {
              removedFavorites[type].push(shortId);
            }
            if (!removedFavorites[type].includes(mongoId)) {
              removedFavorites[type].push(mongoId);
            }
          } else {
            if (!removedFavorites[type].includes(targetId)) {
              removedFavorites[type].push(targetId);
            }
          }
          localStorage.setItem('removedFavorites', JSON.stringify(removedFavorites));
        } catch (e) {
          console.error('Lỗi khi cập nhật danh sách yêu thích đã xóa:', e);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error removing from favorites:', error);
        console.error('Server response:', error.error);
        return of({ 
          success: false, 
          message: error.error?.message || 'Không thể xóa khỏi yêu thích',
          error: error.message
        });
      })
    );
  }

  // Kiểm tra đã yêu thích chưa
  checkFavorite(targetId: string, type: string): Observable<boolean> {
    const accountId = this.getAccountId();
    if (!accountId) {
      console.error('Không có accountId, không thể kiểm tra yêu thích');
      return of(false);
    }
    
    if (!targetId) {
      console.error('targetId không được cung cấp');
      return of(false);
    }
    
    // Xử lý targetId cho blog
    let processedTargetId = targetId;
    if (type === 'blog') {
      // Nếu là ID ngắn (BLxx), chuyển về MongoDB ID
      const blogIdMap: { [key: string]: string } = {
        'BL01': '507f1f77bcf86cd799439011',
        'BL02': '507f1f77bcf86cd799439012',
        'BL03': '507f1f77bcf86cd799439013',
        'BL04': '507f1f77bcf86cd799439014',
        'BL05': '507f1f77bcf86cd799439015'
      };
      processedTargetId = blogIdMap[targetId] || targetId;
    }
    
    // Kiểm tra xem nó có trong danh sách đã xóa không
    try {
      const removedFavorites = JSON.parse(localStorage.getItem('removedFavorites') || '{}');
      const removedIds = removedFavorites[type] || [];
      if (removedIds.includes(targetId) || removedIds.includes(processedTargetId)) {
        console.log('Mục đã bị xóa trong localStorage, trả về false');
        return of(false);
      }
    } catch (e) {
      console.error('Lỗi khi đọc danh sách yêu thích đã xóa:', e);
    }
    
    console.log('Đang kiểm tra trạng thái yêu thích:', { accountId, targetId: processedTargetId, type });
    
    // Encode các tham số URL để tránh lỗi 400 Bad Request
    const encodedAccountId = encodeURIComponent(accountId);
    const encodedTargetId = encodeURIComponent(processedTargetId);
    const encodedType = encodeURIComponent(type);
    
    const url = `${this.apiUrl}/favorites/check?accountId=${encodedAccountId}&targetId=${encodedTargetId}&type=${encodedType}`;
    console.log('URL kiểm tra yêu thích:', url);
    
    return this.http.get(url).pipe(
      tap(response => console.log('Kết quả API kiểm tra yêu thích:', response)),
      map((response: any) => response.exists || false),
      catchError((error: HttpErrorResponse) => {
        console.error('Error checking favorite status:', error);
        console.error('Server response:', error.error);
        return of(false);
      })
    );
  }

  // Lấy danh sách yêu thích
  getFavorites(type?: string): Observable<any[]> {
    const accountId = this.getAccountId();
    if (!accountId) {
      console.error('Không có accountId, không thể lấy danh sách yêu thích');
      return of([]);
    }
    
    let url = `${this.apiUrl}/favorites?accountId=${accountId}`;
    if (type) {
      url += `&type=${type}`;
    }
    
    return this.http.get<any[]>(url).pipe(
      map(favorites => {
        // Lọc các mục đã xóa từ localStorage
        try {
          const removedFavorites = JSON.parse(localStorage.getItem('removedFavorites') || '{}');
          const removedIds = type && removedFavorites[type] ? removedFavorites[type] : [];
          
          if (removedIds.length > 0) {
            console.log(`Lọc bỏ ${removedIds.length} mục đã xóa từ localStorage:`, removedIds);
            favorites = favorites.filter(item => !removedIds.includes(item.targetId));
          }
        } catch (e) {
          console.error('Lỗi khi đọc danh sách yêu thích đã xóa:', e);
        }
      
        // Clean data to remove any potential [object Object] or unwanted data
        return favorites.map(item => {
          // Create a clean copy with only necessary properties
          const cleanItem: any = {
            _id: item._id,
            targetId: item.targetId,
            type: item.type,
            createdAt: item.createdAt,
            details: {} as any
          };
          
          // Only include essential detail properties to avoid [object Object]
          if (item.details) {
            // Create a new object without author property
            const { author, ...detailsWithoutAuthor } = item.details;
            
            // Format any date fields
            cleanItem.details = detailsWithoutAuthor;
            
            // Add special fields for different types
            if (item.type === 'blog') {
              cleanItem.blogTitle = item.details.title || 'Bài viết không có tiêu đề';
              cleanItem.blogImage = item.details.image || '';
              cleanItem.category = item.details.category || 'Chưa phân loại';
            } else if (item.type === 'recipe') {
              cleanItem.recipeName = item.details.recipeName || 'Công thức không có tên';
              cleanItem.recipeImage = item.details.recipeImage || '';
              cleanItem.difficulty = item.details.difficulty || 'Dễ';
              cleanItem.time = item.details.time || '30 phút';
            } else if (item.type === 'product') {
              cleanItem.productName = item.details.ingredientName || 'Sản phẩm không có tên';
              cleanItem.productImage = item.details.mainImage || '';
              cleanItem.price = item.details.price || 0;
              cleanItem.discount = item.details.discount || 0;
            }
          }
          
          return cleanItem;
        });
      }),
      catchError(error => {
        console.error('Lỗi khi lấy danh sách yêu thích:', error);
        return of([]);
      })
    );
  }

  // Lấy danh sách yêu thích với chi tiết đầy đủ
  getFavoritesWithDetails(type: string): Observable<any[]> {
    const accountId = this.getAccountId();
    if (!accountId) {
      console.error('Không có accountId, không thể lấy danh sách yêu thích với chi tiết');
      return of([]);
    }

    if (!type || !['blog', 'recipe', 'product'].includes(type)) {
      console.error('Loại không hợp lệ:', type);
      return of([]);
    }
    
    const url = `${this.apiUrl}/favorites/details/${type}?accountId=${accountId}`;
    console.log(`Đang lấy danh sách yêu thích loại ${type} với chi tiết:`, url);
    
    return this.http.get<any[]>(url).pipe(
      map(response => {
        // Lọc các mục đã xóa từ localStorage
        try {
          const removedFavorites = JSON.parse(localStorage.getItem('removedFavorites') || '{}');
          const removedIds = removedFavorites[type] || [];
          
          if (removedIds.length > 0) {
            console.log(`Lọc bỏ ${removedIds.length} mục đã xóa từ localStorage:`, removedIds);
            response = response.filter(item => !removedIds.includes(item.targetId));
          }
        } catch (e) {
          console.error('Lỗi khi đọc danh sách yêu thích đã xóa:', e);
        }
        
        // Trong trường hợp blog, kiểm tra xem targetId có phải là MongoDB ID không
        if (type === 'blog') {
          response.forEach(item => {
            // Chuyển ObjectId từ MongoDB (mẫu 24 ký tự hex) sang ID ngắn nếu có thể
            if (/^[0-9a-fA-F]{24}$/.test(item.targetId)) {
              // Kiểm tra ánh xạ ngược trong idMap của BlogService
              const shortId = this.getShortIdForBlog(item.targetId);
              if (shortId !== item.targetId) {
                console.log(`Chuyển đổi targetId từ ${item.targetId} sang ${shortId}`);
                // Lưu lại ID MongoDB gốc nếu cần để tham chiếu
                item.originalMongoId = item.targetId;
                // Cập nhật targetId thành ID ngắn
                item.targetId = shortId;
              }
            }
          });
        }
        return response;
      }),
      tap(response => {
        console.log(`Kết quả API lấy danh sách yêu thích ${type} với chi tiết:`, response);
        console.log(`Số lượng items: ${response.length}`);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(`Error fetching ${type} favorites with details:`, error);
        console.error('Server response:', error.error);
        return of([]);
      })
    );
  }

  // Helper để chuyển đổi MongoDB ID sang ID ngắn cho blog
  private getShortIdForBlog(mongoId: string): string {
    // Ánh xạ ngược từ MongoDB ID sang ID ngắn
    const idMap = new Map<string, string>([
      ['507f1f77bcf86cd799439011', 'BL01'],
      ['507f1f77bcf86cd799439012', 'BL02'],
      ['507f1f77bcf86cd799439013', 'BL03'],
      ['507f1f77bcf86cd799439014', 'BL04'],
      ['507f1f77bcf86cd799439015', 'BL05'],
    ]);
    
    return idMap.get(mongoId) || mongoId;
  }

  // Thêm/xóa yêu thích dựa vào trạng thái hiện tại
  toggleFavorite(targetId: string, type: string, isSaved: boolean = false): Observable<FavoriteResponse> {
    console.log(`Toggle favorite for ${targetId} (${type}), current state: ${isSaved}`);
    
    if (isSaved) {
      return this.removeFromFavorites(targetId, type);
    } else {
      return this.addToFavorites(targetId, type);
    }
  }

  toggleFavoriteWithToken(itemId: string, itemType: 'product' | 'recipe', isSaved: boolean): Observable<FavoriteResponse> {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || !user.token) {
      return of({ success: false, message: 'Bạn chưa đăng nhập' });
    }

    const url = `${this.apiUrl}/favorites/${isSaved ? 'remove' : 'add'}`;
    const payload = {
      itemId,
      itemType
    };

    return this.http.post<FavoriteResponse>(url, payload, {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    }).pipe(
      catchError(error => {
        return of({ 
          success: false, 
          message: error.error?.message || 'Đã xảy ra lỗi khi thao tác với mục yêu thích'
        });
      })
    );
  }

  checkFavoriteWithToken(itemId: string, itemType: 'product' | 'recipe'): Observable<boolean> {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || !user.token) {
      return of(false);
    }

    const url = `${this.apiUrl}/favorites/check`;
    return this.http.post<{isFavorite: boolean}>(url, { itemId, itemType }, {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    }).pipe(
      map(response => response.isFavorite),
      catchError(() => of(false))
    );
  }
}