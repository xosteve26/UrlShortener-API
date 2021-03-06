const express = require('express');
const router = express.Router();
const validUrl=require('valid-url');
const shortid=require('shortid');
const config=require('config');


const Url=require('../models/Url');

//@route POST /api/url/shrink
//@desc Shrink a URL
router.post('/shrink',async (req,res)=>{   
    const { longUrl, expiration } = req.body
    const baseUrl = config.get('baseUrl');
    console.log(Date.now());
    console.log(Date.now() + 1000 * 60 * 60 * 24 * 7);

    if(!validUrl.isUri(baseUrl)){
        return res.status(401).json('Invalid Base Url')
    }

    //Create a url code
    const urlCode = shortid.generate();

    //Check long url
    if(validUrl.isUri(longUrl)){
        if(req.session[longUrl] && new Date(req.session[longUrl]['expireAt']) > new Date(Date.now())){
            console.log("CACHE")
            res.json(req.session[longUrl])
        }
        else{
            try {
                let url = await Url.findOne({ longUrl: longUrl });
                if (url) {
                    console.log("URL EXISTS")
                    res.json(url);
                }
                else {
                    console.log("URL DOES NOT EXIST")
                    const shortUrl = baseUrl + '/' + urlCode;
                    let currentTime = Date.now()
                    const urlDocument = new Url({
                        longUrl,
                        shortUrl,
                        urlCode,
                        createdAt: new Date(currentTime),
                        expireAt: expiration && new Date(currentTime + (expiration * 1000))
                    });

                    await urlDocument.save()
                    //Caching the url
                    req.session[longUrl] = urlDocument

                    res.status(200).json(urlDocument);
                }

            }
            catch (err) {
                console.error(err.message);
                return res.status(500).json('Server Error');
            }

        }
            
        
         
    }else{
        res.status(401).json('Invalid Long Url');
    }
});

module.exports = router;