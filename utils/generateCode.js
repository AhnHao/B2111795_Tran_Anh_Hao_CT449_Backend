// Hàm tạo mã số tự động
async function generateCode(model, prefix, field) {
    try {
        // Tìm document cuối cùng được tạo
        const lastDoc = await model.findOne().sort({ [field]: -1 });
        
        if (!lastDoc) {
            // Nếu chưa có document nào, bắt đầu từ 001
            return `${prefix}001`;
        }

        // Lấy số từ mã cuối cùng
        const lastCode = lastDoc[field];
        const numberPart = parseInt(lastCode.substring(prefix.length));
        
        // Tăng số lên 1 và format lại thành chuỗi 3 chữ số
        const nextNumber = numberPart + 1;
        const nextNumberString = nextNumber.toString().padStart(3, '0');
        
        return `${prefix}${nextNumberString}`;
    } catch (error) {
        throw new Error('Lỗi khi tạo mã số');
    }
}

module.exports = generateCode; 