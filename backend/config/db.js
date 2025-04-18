const mongoose=require('mongoose')


const Connectdb=async()=>{

    try{
        const connect=await mongoose.connect(process.env.MONGO_URI)


        console.log(`Mongodb Connected`);
        

    } catch(error){
        console.error(`Error Connectng to Mongodb: ${error.message}`)
    }

}

module.exports=Connectdb;