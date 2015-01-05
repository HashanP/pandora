UI.registerHelper('eq', function(v1, v2, options) {
  if(v1 == v2){
    return true
  } else {
    return false
  }
});

UI.registerHelper("truncate", function(text, max) {
  text = $("<p>" + text + "</p>").text();
  if(text.length > max) {
    return text.substring(0, max) + "...";
  }
  return text;
});

UI.registerHelper("i", function(obj) {
  if(!obj) return null;
  obj.forEach(function(item, i) {
    item.index = i;
  });
  return obj;
});

UI.registerHelper("sortBy", _.sortBy);
UI.registerHelper("shuffle", _.shuffle);

UI.registerHelper("sortByReverse", function(arr, val) {
  return _.sortBy(arr, val).reverse();
})

UI.registerHelper("titleCase", function(str) {
  var result = str.replace(/([A-Z]+)/g, " $1").replace(/([A-Z][a-z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
});

UI.registerHelper("britishDate", function(date) {
  console.log(date);
  return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
});

UI.registerHelper("getScore", function(attempt, quiz) {
  try {
    return getInfo(attempt, quiz).score;
  } catch (e) {
    console.log(e);
  }
});

UI.registerHelper("not", function(val) {
  return !val;
});

UI.registerHelper("isTeacher", function() {
  return isAdmin() || this.doc && this.doc.teachers && this.doc.teachers.indexOf(Meteor.userId()) !== -1;
});

UI.registerHelper("notEmpty", function(arr) {
  return arr && arr.length !== 0;
});

UI.registerHelper("joinByComma", function(arr) {
  if(arr) {
    return arr.join(",");
  }
});
