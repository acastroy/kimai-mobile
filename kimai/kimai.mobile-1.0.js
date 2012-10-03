/**
 * Kimai - mobile web frontend
 *
 * @version 0.1
 * @author Kevin Papst <kpapst@gmx.net>
 */

/**
 * global variable to store the currently running timer.
 */
lastTimer = null;

// this might be moved to the global scope instead!
$(document).bind('pageinit', function() {
    var obj = $.mobile.path.parseUrl(location.href);
    Kimai.setJsonApi(obj.domain + obj.directory + '../core/json.php');
});

$('#recorderPage').live('pageshow', function(event, ui){

    // make sure only authenticated user can enter this page
    if (!checkAuthentication(true)) {
        return;
    }

    initRecorderPage();

    // actions on start and stop tasks
    $('#recorder').bind('change', function() {
        if(checkAuthentication(true)) {
            startStopRecord();
        }
    });
    $('#tasks').bind('change', function() {
        if(checkAuthentication(true)) {
            validateStartStopButton();
        }
    });
    $('#projects').bind('change', function() {
        if(checkAuthentication(true)) {
            validateStartStopButton();
        }
    });
});

/**
 * Running when page loads.
 * Initializes the environment and attaches some action handler to buttons.
 */
$( document ).delegate("#loginpage", "pageinit", function() {
    $('#password').bind('change keydown keypress keyup', function(){
        validateLoginButton();
    });
    $('#username').bind('change keydown keypress keyup', function(){
        validateLoginButton();
    });

    // authentication logic
    $('#btnLogin').bind('click', function() {
        if (Kimai.authenticate($('#username').val(), $('#password').val())) {
            $.mobile.loading('show');
            $.mobile.changePage('#recorderPage', {transition: 'pop', role: 'page'});
            $.mobile.loading('hide');
        } else {
            $('#btnLogin').button('disable');
            $(this).parent().find('span.ui-icon').removeClass('ui-icon-check').addClass('ui-icon-alert');
        }
    });
});

function initRecorderPage()
{
    setProjects(Kimai.getProjects());
    setTasks(Kimai.getTasks());
    setActiveTask(Kimai.getRunningTask());
}

function setWindowState(title, stateMsg)
{
    document.title = title;
    $('#duration').text(stateMsg);
}

/**
 * This function cares about starting and stopping of an entry.
 * Also updates the visual UI elements.
 */
function startStopRecord()
{
    var task = Kimai.getRunningTask();
    if (task != null) {
        if (!Kimai.stop(task.timeEntryID)) {
            Kimai.error('Could not stop entry');
        }
    } else {
        if (!Kimai.start($('#projects').val(),$('#tasks').val())) {
            Kimai.error('Could not start entry');
        }
    }

    setActiveTask(Kimai.getRunningTask());
}

function checkAuthentication(showLogin)
{
    if(!Kimai.isAuthenticated()) {
        if (showLogin) {
            $.mobile.changePage('#loginpage', {transition: 'pop', role: 'page'});
        }
        return false;
    }
    return true;
}

/**
 * Sets the active task and all UI components into their correct state.
 */
function setActiveTask(task)
{
    if (task == null)
    {
        $('#projects').selectmenu('enable');
        $('#tasks').selectmenu('enable');
        $('#recorder').val('off');
        window.clearTimeout(lastTimer);
        setWindowState('Kimai Mobile: Easy mobile Time-Tracking v0.2', 'Please select the task you want to start');
    }
    else
    {
        $('#projects').val(task.projectID);
        $('#tasks').val(task.activityID);
        $('#projects').selectmenu('disable');
        $('#tasks').selectmenu('disable');
        $('#recorder').val('on');
        updateTimer(task.start);
    }

    $('#recorder').slider('refresh');
    $('#projects').selectmenu('refresh');
    $('#tasks').selectmenu('refresh');
}

function updateTimer(start)
{
    var currently = new Date();
    currently.setTime(currently.getTime() - (start*1000));
    // @FIXME getUTCHours depends on server and client settings
    var hours = currently.getUTCHours();
    if (hours < 10) {
        hours = "0" + hours;
    }
    var minutes = currently.getMinutes();
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    var seconds = currently.getSeconds();
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    var formTime = hours + ':' + minutes + ':' + seconds;
    setWindowState(formTime, 'You are now working: ' + formTime);
    lastTimer = window.setTimeout('updateTimer('+start+')', 1000);
}

function setProjects(projects)
{
    if (projects == null) {
        Kimai.error('Sorry, but the project list could not be loaded');
    }

    Kimai.debug('setProjects', projects);

    $.each(projects, function(index, theEntry) {
        $('#projects').append(
            $('<option></option>').val(theEntry.projectID).html(theEntry.name + " ("+theEntry.customerName+")")
        );
    });
    $('#projects').selectmenu('refresh');
}

function setTasks(tasks)
{
    if (tasks == null) {
        Kimai.error('Sorry, but the task list could not be loaded');
    }

    Kimai.debug('setTasks', tasks);

    $.each(tasks, function(index, theEntry) {
        $('#tasks').append(
            $('<option></option>').val(theEntry.activityID).html(theEntry.name)
        );
    });
    $('#tasks').selectmenu('refresh');
}


function validateStartStopButton()
{
    var mySlider   = $('#recorder');
    var myProjects = $('#projects');
    var myTasks    = $('#tasks');

    // switch the start/stop button
    if (myTasks.val() != '' && myProjects.val() != '') {
        mySlider.slider('enable');
        mySlider.parent().find('span.ui-icon').removeClass('ui-icon-alert').addClass('ui-icon-check');
    } else {
        mySlider.slider('disable');
        mySlider.parent().find('span.ui-icon').removeClass('ui-icon-check').addClass('ui-icon-alert');
    }

    mySlider.slider('refresh');
}

function validateLoginButton()
{
    var myButton = $('#btnLogin');
    if ($('#username').val() != '' && $('#password').val() != '') {
        myButton.button('enable');
        myButton.parent().find('span.ui-icon').removeClass('ui-icon-alert').addClass('ui-icon-check');
        return true;
    }

    myButton.button('disable');
    myButton.parent().find('span.ui-icon').removeClass('ui-icon-check').addClass('ui-icon-alert');
    return false;
}

var KimaiLogger = {

    error: function(msg)
    {
        $('#dialogMessage').html('<p>'+msg+'</p>');
        $.mobile.changePage('#dialogPage', {transition: 'pop', role: 'dialog'});
    },

    debug: function(title, value) {
        return;
        console.log(' ==========> ' + title);
        console.log(value);
    }
}

Kimai.setLogger(KimaiLogger);
