module.exports =  function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("_redirects");
  eleventyConfig.addPassthroughCopy("functions");

  return {
    dir: {
      // These values is relative to your input directory.
      input: 'src',
      layouts: '_layouts'
    }
  }
};