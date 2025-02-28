const http = require('http'); // Nhập mô-đun http  

const hostname = 'localhost'; // Địa chỉ hostname (localhost)  
const port = 1107; // Cổng máy chủ  

const server = http.createServer((req, res) => { // Tạo máy chủ  
    res.statusCode = 200; // Thiết lập mã trạng thái HTTP là 200 (OK)  
    res.setHeader('Content-Type', 'text/plain'); // Thiết lập header content type  
    res.end('Hello World\n Tao la trum code'); // Gửi phản hồi về phía khách hàng  
});  

server.listen(port, hostname, () => { // Lắng nghe yêu cầu tại cổng và hostname  
    console.log(`Server running at http://${hostname}:${port}/`); // In ra thông báo máy chủ đang chạy  
});  `` 