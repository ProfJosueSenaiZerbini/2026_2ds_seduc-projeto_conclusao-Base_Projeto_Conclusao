const bcrypt = require("bcryptjs");
const database = require("../SRC/DATABASE/connection");
require("dotenv").config();

async function criarAdmin() {
    try{
        const nome = process.env.ADMIN_NOME;
        const email = process.env.ADMIN_EMAIL;
        const senha = process.env.ADMIN_SENHA;

        senhaHash = await bcrypt.hash(senha, 10);

        await database.query(
            `INSERT INTO
             usuario(nome,email,senha)
            VALUES( ?,?,?)
            `,
            [nome,email,senhaHash]
        );

        console.log("administrador criado!");
        console.log(`Email:${email}`);

        
    }catch(e){
        if(e.code==="ER_DUP_ENTRY"){
            console.error("adiministrador ja cadastradoooo");
    }else{
        console.error(e);
    
    }
    }finally{
        await database.end();
    }
}
criarAdmin();