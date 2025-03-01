const getHomepage = (req, res) => {
    res.send('Hello World! và hồ tiến đạt hữu ích quá đi'); // Sending a response  
}
const getabc = (req, res)=> {
    // process data
    // call model
    res.send('Check Abc')
}
const gethoitaodi = (req, res)=>{
    res.render("sample.ejs")
    // res.send('<h1>Hỏi tao đi mầy</h1>'); // Sending a response  
}
module.exports = {
    getHomepage,getabc, gethoitaodi
}