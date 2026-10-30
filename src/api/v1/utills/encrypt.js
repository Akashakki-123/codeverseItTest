
import bcrypt from "bcryptjs";



export const encryptPassword = (password)=>{
    let salt = bcrypt.genSaltSync(10)
    return bcrypt.hashSync(password,salt);
}


export const verifyPassword = (password,dbPassword)=>{
    return bcrypt.compareSync(password,dbPassword)
}