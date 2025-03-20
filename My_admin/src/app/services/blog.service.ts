import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Blog } from '../models/blog.interface';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  private apiUrl = 'http://localhost:3000/api/blogs';

  constructor(private http: HttpClient) {}

  getBlogs(): Observable<Blog[]> {
    console.log('Fetching all blogs from API endpoint:', this.apiUrl);
    return this.http.get<Blog[]>(this.apiUrl).pipe(
      tap((blogs) => {
        console.log('Fetched blogs count:', blogs.length);
        if (blogs.length > 0) {
          console.log('First blog in the list:', blogs[0]);
          console.log(
            'First blog ID format:',
            blogs[0]._id,
            'Type:',
            typeof blogs[0]._id
          );
        }
      }),
      catchError(this.handleError)
    );
  }

  getBlogById(id: string): Observable<Blog> {
    return this.http.get<Blog>(`${this.apiUrl}/${id}`).pipe(
      tap((blog) => console.log('Fetched blog id:', blog._id)),
      catchError(this.handleError)
    );
  }

  createBlog(blog: Blog): Observable<Blog> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    console.log('Creating blog with data:', blog);
    return this.http.post<Blog>(this.apiUrl, blog, { headers }).pipe(
      tap((createdBlog) =>
        console.log('Created blog with id:', createdBlog._id)
      ),
      catchError(this.handleDetailedError)
    );
  }

  updateBlog(id: string, blog: Blog): Observable<Blog> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const apiEndpoint = `${this.apiUrl}/${id}`;

    console.log(`Updating blog with ID: "${id}"`);
    console.log(`API endpoint: ${apiEndpoint}`);

    // Important: Make sure blog has the correct ID format
    const blogToUpdate = {
      ...blog,
      _id: id, // Ensure the ID matches exactly what we're using in the URL
    };

    console.log(`Blog data to update:`, JSON.stringify(blogToUpdate, null, 2));

    // For debugging, try to get the blog first to see what fields might be different
    this.getBlogById(id).subscribe(
      (existingBlog) => {
        console.log(
          'Successfully retrieved existing blog with ID:',
          existingBlog._id
        );
        console.log('Existing blog data:', JSON.stringify(existingBlog));
        console.log('Fields that will be updated:');
        // Compare key fields
        if (existingBlog.title !== blog.title)
          console.log('- title will change');
        if (existingBlog.slug !== blog.slug) console.log('- slug will change');
        if (
          JSON.stringify(existingBlog.sections) !==
          JSON.stringify(blog.sections)
        )
          console.log('- sections will change');
      },
      (error) => {
        console.error(`Error getting existing blog with ID "${id}":`, error);
        console.log('Will attempt update anyway');
      }
    );

    return this.http.patch<Blog>(apiEndpoint, blogToUpdate, { headers }).pipe(
      tap((updatedBlog) =>
        console.log('Updated blog with id:', updatedBlog._id)
      ),
      catchError(this.handleDetailedError)
    );
  }

  deleteBlog(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log('Deleted blog id:', id)),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(errorMessage);
  }

  private handleDetailedError(error: HttpErrorResponse) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      console.error('Response body:', error.error);

      // Try to extract more error details if available
      if (error.error && typeof error.error === 'object') {
        const serverError = error.error;
        if (serverError.message) {
          errorMessage += `\nServer message: ${serverError.message}`;
        }
        if (serverError.error) {
          errorMessage += `\nDetail: ${serverError.error}`;
        }
        if (serverError.stack) {
          console.error('Server stack trace:', serverError.stack);
        }
      }
    }
    console.error('Detailed error:', errorMessage);
    return throwError(errorMessage);
  }
}
