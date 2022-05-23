// Require the framework and instantiate it
const fastify = require('fastify')({
  logger: true
})

const https = require('https');
const axios = require('axios');
const xl = require('excel4node');
const AWS = require("aws-sdk");

require('dotenv').config();

// Import Swagger Options
const swagger = require('./swagger')

// Register Swagger
fastify.register(require('@fastify/swagger'), swagger.options)

// Declare a route
fastify.get('/', async (request, reply) => {
  return axios
  .get('https://swapi.py4e.com/api/films')
  .then(res => {
    console.log(`Response --> statusCode: ${res.status}`);
    var films = [];

    for (x = 0; x< res.data.results.length; x++){
      films.push({
        release_date:res.data.results[x].release_date,
        title:res.data.results[x].title,
        producer:res.data.results[x].producer,
        director:res.data.results[x].director,
        opening_crawl:res.data.results[x].opening_crawl,
        
      });
    }
    return films;
  })
  .catch(error => {
    console.error(error);
  });
})

fastify.get('/generate', async (request, reply) => {
  return axios
  .get('https://swapi.py4e.com/api/films')
  .then(res => {
    console.log(`Response --> statusCode: ${res.status}`);
    var films = [];

    for (x = 0; x< res.data.results.length; x++){
      films.push({
        release_date:res.data.results[x].release_date,
        title:res.data.results[x].title,
        producer:res.data.results[x].producer,
        director:res.data.results[x].director,
        description:res.data.results[x].opening_crawl,
        
      });
    }

    const wb = new xl.Workbook();
    const ws = wb.addWorksheet('Worksheet Star Wars Films'); 

    const headingColumnNames = [
      "Release Date",
      "Title",
      "Producer",
      "Director",
      "Description",
    ]

    let headingColumnIndex = 1;
    headingColumnNames.forEach(heading => {
        ws.cell(1, headingColumnIndex++)
            .string(heading)
    });

    let rowIndex = 2;
    films.forEach( record => {
        let columnIndex = 1;
        Object.keys(record ).forEach(columnName =>{
            ws.cell(rowIndex,columnIndex++)
                .string(record [columnName])
        });
        rowIndex++;
    });

    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    var seconds = today.getSeconds();
    var minutes = today.getMinutes();
    var hour = today.getHours();

    filename = `report-${mm}-${dd}-${yyyy}-${hour}-${minutes}-${seconds}.xlsx`;
    wb.write(filename, function(err, stats) {
      if (err) {
        console.error(err);
      } else {
        uploadS3(filename)
      }
    });

    return {
      message:'Excel generado'
    };
  })
  .catch(error => {
    console.error(error);
  });
})

function uploadS3(filepath){
    AWS.config.update({
      secretAccessKey: process.env.SECRET_KEY,
      accessKeyId: process.env.ACCESS_KEY,
      region: process.env.REGION
    });

    var s3 = new AWS.S3({apiVersion: '2006-03-01'});

    // call S3 to retrieve upload file to specified bucket
    var uploadParams = {Bucket: process.env.BUCKET, Key: '', Body: ''};
    var file = filepath;

    // Configure the file stream and obtain the upload parameters
    var fs = require('fs');
    var fileStream = fs.createReadStream(file);
    fileStream.on('error', function(err) {
      console.log('File Error', err);
    });
    uploadParams.Body = fileStream;
    var path = require('path');
    uploadParams.Key = path.basename(file);

    // call S3 to retrieve upload file to specified bucket
    s3.upload(uploadParams, function (err, data) {
      if (err) {
        console.log("Error", err);
      } if (data) {
        console.log("Upload Success", data.Location);


        const signedUrl = s3.getSignedUrl("getObject", {
          Key: file,
          Bucket: process.env.BUCKET,
          Expires: parseInt(process.env.EXPIRES) || 900, // S3 default is 900 seconds (15 minutes)
        });

        console.log(`Temporal Download URL: ${signedUrl}`);

        //Remove local file
        try {
          fs.unlinkSync(file)
        } catch(err) {
          console.error(err)
        }
      }
    });

}

// Run the server!
const start = async () => {
  try {
    await fastify.listen(3000)
    fastify.log.info(`server listening on ${fastify.server.address().port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()