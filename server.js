const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req,res)=>
    res.send('hello from node project cicd aci')
);

app.listen(port,()=>
    console.log(`app is listening on port ${port}`)
);