const express=require('express')
const {MongoClient}=require('mongodb')
const cors = require("cors");
const nodemailer=require('nodemailer')
const jwt=require('jsonwebtoken')
const otpgenerator=require('otp-generator')

const url =
  "mongodb+srv://Krishna123:1234567890@cluster0.i5fh2ng.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const cluster = new MongoClient(url);
const database = cluster.db("property");
const users = database.collection("users");
const properties=database.collection("properties")

const secret_key="qwertyuiop";

const app=express();
app.use(cors())
app.use(express.json())

const client=nodemailer.createTransport({
    service:"gmail",
    auth:{
        user: 'kr4785543@gmail.com', // Replace with your actual email address
        pass: 'lbrb ercs mxjq oevr', 
    }
})

const generateOTP=()=>{
    const otp=otpgenerator.generate(6,{upperCaseAlphabets: false, specialChars: false,lowerCaseAlphabets:false})
    return otp;
}

app.post('/userregister',async (req,res)=>{
    try{
        const { name, mobile, email,gender, password, rpassword, dob }=req.body;
    await cluster.connect();
    const response=await users.findOne({"email":email[0]})
    if(password[0]!=rpassword[0]){
        return res.json({"response":"0"})
    }
    if(response===null){
        await users.insertOne({"name":name[0],"mobile":mobile[0],"email":email[0],"gender":gender[0],"password":password[0],"dob":dob[0]})
        await cluster.close()
        client.sendMail({
            from:"Guestbook",
            to:email[0],
            subject:"Registration confirmation",
            text:"Congratulations "+name[0]+" on successful registration in guestbook."
        })
        return res.json({"response":"1"})
    }
    else{
        await cluster.close()
        return res.json({"response":"2"})
    }
    }
    catch(err){
        return res.json({"response":err}) 
    }
})

app.post('/userlogin',async (req,res)=>{
    try{
        const {email,password,token}=req.body;
    await cluster.connect();
    const response=await users.findOne({"email":email})
    await cluster.close();
    if(!response){
        return res.json({"response":"0"})       //user does not exist
    }
    else{
        if(response["password"]===password){
            const payload={
                data:{
                    useremail:email,
                    usertype:"users"
                }
            }
            const token=jwt.sign(payload,secret_key)
            return res.json({"response":"1","token":token})      //password correct
        }
        else{
            return res.json({"response":"2"})       //invalid credentials
        }
    }
    }
    catch(err){
        return res.json({"response":err})
    }
})

app.post('/sendotp',async (req,res)=>{
    try{
        const email=req.body.email;
    await cluster.connect()
    const user1=await users.findOne({"email":email})
    const otp=generateOTP()
    const data={
        from:"Guest book",
        to:email,
        subject:"OTP to reset password",
        text:"Your OTP to reset your password is "+otp
    }
    if(user1){
        client.sendMail(data,()=>{console.log("OTP sent successfully")})
        return res.json({"response":"1","usertype":"user","email":email,"otp":otp})
    }

    else{
        return res.json({"response":"0"})
    }
    }
    catch(err){
        console.log((err))
    }
})

app.post('/verifyotp',(req,res)=>{
    const {otp,localotp}=req.body;
    if(otp===localotp){
        return res.json({"response":"1"})
    }
    else{
        return res.json({"response":"0"})
    }
})

app.post('/resetpassword',async (req,res)=>{
   try{
    const {newpassword,rnewpassword,email,usertype}=req.body;
    if(newpassword!=rnewpassword){
        return res.json({"response":"0"})
    }
    await cluster.connect()
    if(usertype==="user"){
        await users.updateOne({"email":email},{"$set":{"password":newpassword}})
        return res.json({"response":"1"})
    }
    else if(usertype==='college'){
        await colleges.updateOne({"email":email},{"$set":{"password":newpassword}})
        return res.json({"response":"1"})
    }
    else{
        await guests.updateOne({"email":email},{"$set":{"password":newpassword}})
        return res.json({"response":"1"})
    }
   }
   catch(err){
        console.log(err)
   }
    
})

app.post('/sellhouse',async (req,res)=>{
    try{
        const { year,area,housetype,address,img1,img2,cost,token } = req.body;
        const decoded=jwt.verify(token,secret_key)
        if(decoded.data['useremail']===null){
            return res.json({"response":"0"})
        }
        await cluster.connect()
        await properties.insertOne({"year":year,"area":area,"housetype":housetype,"address":address,"img1":img1,"img2":img2,"cost":cost,"category":"house","owner":decoded.data['useremail']})
        await cluster.close()
        return res.json({"response":"1"})
        
    }  catch(err){
        return res.json({"response":err})
    }
})

app.post('/sellapartment',async (req,res)=>{
    try{
        const {year,area,roomstype,address,floors,parking,img1,img2,cost,token}=req.body;
    await cluster.connect()
    await properties.insertOne({"year":year,"area":area,"roomstype":roomstype,"address":address,"floors":floors,"parking":parking,"img1":img1,"img2":img2,"cost":cost,"category":"apartment","owner":decoded.data['useremail']})
    return res.json({"response":"1"})
    }
    catch(err){
        return res.json({"response":err})
    }
})

app.post('/sellland',async (req,res)=>{
    try{
        const {year,area,landtype,address,img1,img2,cost,token}=req.body;
        const decoded=jwt.verify(token,secret_key)
        await properties.insertOne({"shape":year,"area":area,"landtype":landtype,"address":address,"img1":img1,"img2":img2,"cost":cost,"category":"land","owner":decoded.data['useremail']})
        return res.json({"response":"1"})
    }
    catch(err){
        return res.json({"response":err})
    }
})

app.get('/getapartments',async (req,res)=>{
   try{
    await cluster.connect();
   const propData=await properties.find({"category":"apartment"}).toArray()
   return res.json(propData).status(200)
   }
   catch(err){
    return res.json({"response":err})
   }
}
)

app.get('/getlands',async (req,res)=>{
    try{
     await cluster.connect();
    const propData=await properties.find({"category":"land"}).toArray()
    return res.json(propData).status(200)
    }
    catch(err){
     return res.json({"response":err})
    }
 }
 )
 app.get('/gethouses',async (req,res)=>{
    try{
     await cluster.connect();
    const propData=await properties.find({"category":"house"}).toArray()
    return res.json(propData).status(200)
    }
    catch(err){
     return res.json({"response":err})
    }
 }
 )

 app.post('/getownerdetails',async (req,res)=>{
    try{
        const {token}=req.body;
    const decoded=jwt.verify(token,secret_key)
    await cluster.connect()
    const owner=await users.findOne({"email":decoded.data['useremail']})
    console.log(owner)
    return res.json({"response":"1","owner":owner})
    } 
    catch(err){
        return res.json({"response":err})
    }
 })

app.listen(5000,()=>{
    console.log("Server started running.........")
})