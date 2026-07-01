export async function askOrion(message:string){

    const res=await fetch("http://localhost:5000/api/chat",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            message

        })

    });

    const data=await res.json();

    if(!data.success){

        throw new Error(data.message);

    }

    return data.reply;

}