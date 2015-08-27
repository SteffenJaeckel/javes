var currentEditor;

Template.innerpage.helpers({
  content: function () {
    return "<h1>Hallo</h1><p>welt ...</p>";
  }
})

Template.innerpage.events({
  'dblclick .editable':function ( e ) {
    console.log('edit')
    $(e.currentTarget).addClass('editing').trumbowyg({
      autogrow: false,
      btns: ['formatting',
      '|', 'btnGrp-design',
      '|', 'btnGrp-justify',
      '|', 'btnGrp-lists']
    });
  },
  'blur .editing': function ( e ) {
    console.log("save edits ...");
    $('.editing').trumbowyg('destroy');
    $(e.currentTarget).removeClass('editing');

  }
})
