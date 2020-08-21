const NODE_TYPE = "S3Markdown"

const AWS = require('aws-sdk');
const axios = require('axios');
const matter = require('gray-matter');


exports.sourceNodes = async ({ actions, createContentDigest, createNodeId }, options) => {

    const bucketName = options.bucket;
    const region = options.region;

    AWS.config.update(options.aws_credentials);

    s3 = new AWS.S3({ apiVersion: '2006-03-01' });


    const { createNode } = actions;

    const data = {
        S3Markdowns: await getDataFromS3(bucketName, region)
    };

    data.S3Markdowns.forEach(S3Markdown =>
        createNode({
            ...S3Markdown,
            id: createNodeId(`${NODE_TYPE}-${S3Markdown.data.id}`),
            // parent: null,
            // children: [],
            internal: {
                type: NODE_TYPE,
                // mediaType: "text/markdown",
                contentDigest: createContentDigest(S3Markdown)
            },
        })
    )

    return
}


const getDataFromS3 = async (bucketName, region) => {

    var fileInBucket = await s3.listObjects({
        Bucket: bucketName,
    }).promise();

    const fileNames = fileInBucket.Contents.map(element => {
        return element.Key;
    });


    const markdownTable = await Promise.all(
        fileNames.map(async (file) => {
            var response = await axios.get(`https://${bucketName}.s3-${region}.amazonaws.com/${file}`);

            var model = matter(response.data);
            return model;
        }));

    return markdownTable;
}