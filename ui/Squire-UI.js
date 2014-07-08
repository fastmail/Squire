if (typeof buildPath == "undefined") {
        buildPath = 'build/';
}

function buildPathConCat(value) {
    return buildPath + value;
}


$(document).ready(function () {
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
                "No element was defined for the editor to inject to."
            );
        }
        var iframe = document.createElement('iframe');
        var div = document.createElement('div');
        div.className = 'Squire-UI';
        
        $(div).load(buildPath + 'Squire-UI.html', this.menuAction);

        $(container).append(div);
        $(container).append(iframe);

        iframe.contentWindow.editor = new Squire(iframe.contentWindow.document);
        return iframe.contentWindow.editor;
    };

    SquireUI.menuAction = function() {
      $('.item').click(function() {
        var me = $(this);
        var iFrame = me.parents('.Squire-UI').next('iframe').first()[0];
        var editor = iFrame.contentWindow.editor;
        try {
          editor[me.data('action')](me.data('value'));
        } catch (error) {
          console.log(error);
        }
      });
    };

    SquireUI.isBold = isPresent( 'B', ( />B\b/ ) );
    SquireUI.isItalic = isPresent( 'I', ( />I\b/ ) );
    SquireUI.isUnderlined = isPresent( 'U', ( />U\b/ ) );
    SquireUI.isStriked = isPresent( 'S', ( />S\b/ ) );
    SquireUI.isLink = isPresent( 'A', ( />A\b/ ) );
    SquireUI.isPresent = function () {
        editor.getPath()  
    }; 

    SquireUI.whenTextSelected = function () {
        
    }


});