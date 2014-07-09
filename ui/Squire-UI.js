if (typeof buildPath == "undefined") {
  buildPath = 'build/';
}

function buildPathConCat(value) {
  return buildPath + value;
}
$(document).ready(function() {
  Squire.prototype.testPresenceinSelection = function(name, action, format,
    validation) {
    var path = this.getPath(),
      test = (validation.test(path) | this.hasFormat(format));
    if (name == action && test) {
      return true;
    } else {
      return false;
    }
  };
  SquireUI = function(options) {
    // Create instance of iFrame
    var container, editor;
    if (options.replace) {
      container = $(options.replace).parent();
      $(options.replace).remove();
    } else if (options.div) {
      container = $(options.div);
    } else {
      throw new Error(
        "No element was defined for the editor to inject to.");
    }
    var iframe = document.createElement('iframe');
    var div = document.createElement('div');
    div.className = 'Squire-UI';
    $(div).load(buildPath + 'Squire-UI.html', function() {
      $('.item').click(function() {
        var iframe = $(this).parents('.Squire-UI').next('iframe').first()[0];
        var editor = iframe.contentWindow.editor;
        var action = $(this).data('action');
        
        test = {
          testBold: editor.testPresenceinSelection('bold',
            action, 'B', (/>B\b/)),
          testItalic: editor.testPresenceinSelection('italic',
            action, 'I', (/>I\b/)),
          testUnderline: editor.testPresenceinSelection(
            'underline', action, 'U', (/>U\b/)),
          testOrderedList: editor.testPresenceinSelection(
            'makeOrderedList', action, 'OL', (/>OL\b/)),
          testLink: editor.testPresenceinSelection('makeLink',
            action, 'A', (/>A\b/)),
          testQuote: editor.testPresenceinSelection(
            'increaseQuoteLevel', action, 'blockquote', (
              />blockquote\b/))
        };
        
        if (test.testBold | test.testItalic | test.testUnderline | test.testOrderedList | test.testLink | test.testQuote) {
          if (test.testBold) editor.removeBold();
          if (test.testItalic) editor.removeItalic();
          if (test.testUnderline) editor.removeUnderline();
          if (test.testLink) editor.removeLink();
          if (test.testOrderedList) editor.removeList();
          if (test.testQuote) editor.decreaseQuoteLevel();
        } else {
          editor[$(this).data('action')]();
        }
      });
    });
    $(container).append(div);
    $(container).append(iframe);
    iframe.contentWindow.editor = new Squire(iframe.contentWindow.document);
    iframe.contentWindow.editor.setHTML(
      "<div><b>Bold</b><br></div><div><i>Italics</i><br></div><div><u>Underline</u><br></div><ol><li><div>List<br></div></li><li><div>List<br></div></li><li><div>List<br></div></li></ol><blockquote>Quote<br></blockquote><div><br></div><div>Heading 1<br></div><div>Heading 2<br></div><div>Image<br></div><div>Link</div><div><br></div>"
    );
    return iframe.contentWindow.editor;
  };
});