Meteor.startup(function () {
  if(!Meteor.users.find().count()) {
    console.log("Creating Default Admin Account");
    var options = {
      username: 'admin',
      password: 'admin',
      email: 'admin@whsb.essex.sch.uk'
    };
    var id = Accounts.createUser(options);
    console.log(id);
    Roles.addUsersToRoles(id, ["admin"]);
  }
});
