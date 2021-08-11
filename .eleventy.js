module.exports =  function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("_redirects");

  return {
    dir: {
      // These values is relative to your input directory.
      input: 'src',
      layouts: '_layouts'
    }
  }
};