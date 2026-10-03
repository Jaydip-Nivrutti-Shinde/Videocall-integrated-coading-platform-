old browsers put all video data on ram then sends to storage system 
but nowdays chrome and all send data to cloud in chunks know as streaming process
multer - middleware same like expres.json()
major issue with streaming that once started and stoped between then need to send complete againa or downlode again all - hence we sends using chunks kyuki 
api key - 
api secrete - 
cloud name - 

work flow of video - frontend se request to uplode data -> backend sedn responcce as api key(public key), cloud name, digital signature using private key i.e. api secrete it has encoded informations like timestamp, folder etc... - this all information sended to clodanary and cloudanary verifies that signature



