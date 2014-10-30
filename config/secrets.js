/**
 * IMPORTANT * IMPORTANT * IMPORTANT * IMPORTANT * IMPORTANT * IMPORTANT *
 *
 * You should never commit modifications to this file to a public repository
 * on GitHub!
 * 
 * All public code on GitHub can be searched, that means anyone can see your
 * uploaded secrets.js file.
 * 
 * Sensitive data refers to any changes you made to this file such adding
 * a MongoLab or MongoHQ uri which other people could use for their benefit.
 * 
 * N.B. Addresses pointing to "localhost" are safe as everybody's "localhost"
 * is different. The same applies to "process.env.X" as those are just references
 * to environment variables setup by Heroku et al.
 * 
 * If you have already commited this file to GitHub with your keys, then
 * refer to https://help.github.com/articles/remove-sensitive-data
*/

module.exports = {
	/*
	 * Code checks whether either an environment variable `MONGODB` or `MONGOLAB_URI` 
	 * have been set. Otherwise tries localhost. This is where to add an alternative 
	 * MongoDB uri.
	 */
	db: process.env.MONGODB || process.env.MONGOLAB_URI || "mongodb://localhost:27017/pandora"
};
