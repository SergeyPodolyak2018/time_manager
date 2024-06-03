
<%@include file="includes/prefix.jsp"%>
<%@include file="includes/injectThemeName.jsp"%>
<%@page import="com.companylabs.customer70.server.Util"%>
<customer:processEvent id="bean" module="Applet" scope="request" type="com.companylabs.customer70.server.beans.AppletBean">

<!doctype html>
<html>
  <head>
  	<%-- X-UA-Compatible should be above in the document as possible --%>
  	<meta http-equiv="X-UA-Compatible" content="IE=<customer:emulateIEVersion />">
	<link rel="shortcut icon" href="<%= getServletConfig().getServletContext().getContextPath()  %>/favicon.ico" />
	<link rel="stylesheet" type="text/css" rel="stylesheet" href="themes/standard/sprite_60fps.css"/>
    <link type="text/css" rel="stylesheet" href="themes/<c:out value="${theme}"/>/loading-spinner.css">
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">
    <title><customer:translate language="${bean.language}" name="S_SUPERVISOR_TITLE"/></title>
    <script type="text/javascript">
        function onWindowUnload() {
            try { window.jsniOnWindowUnload(); } catch(ex) { /*pass*/ }
        }
    </script>
  </head>

  <body onUnload="onWindowUnload()" class="loading">

        <div id="loading">
            <div class="spinner-container fast-spinner">
                 <div class="shapeshifter play" style="background-image: url(themes/standard/images/sprite_60fps.svg)"></div>
            </div>
        </div>

        <script type="text/javascript">
	  		<%-- Application context (e.g. 'customer' or empty if application has been deployed on ROOT context) --%>
  			var ctx = '<c:out value="${pageContext.request.contextPath}"/>';

	  		<customer:dateTimeFormatInfo useJavaDateTimePatterns="true" />
	  		<customer:numberConstants />
            <%-- This will inject all content of Localization.Supervisor.properties and DefaultLocalization.Supervisor.properties --%>
            <customer:injectTranslations lang="${bean.language}" />

            var appletAttributes = {
                classid:'clsid:8AD9C840-044E-11D1-B3E9-00805F499D93',
                id:'customerAdminApplet', name:'customerAdminApplet',
                width:'100%', height:'100%', align:'middle', hspace:'0', vspace:'0'
            };

            function getVersions() {
                var versions = [];
                for (var lib in getLibs()) {
                    versions.push('<jsp:include page="includes/versions.jsp"/>');
                }
                return versions;
            }

            function getLibs() {
                return new Array('customerclient.jar');
            }

            function getGraphReportsAvailability() {
                <% boolean graphReports = Util.isGraphReportsEnabled(); %>
            	var result = '<%=String.valueOf(graphReports)%>';
            	return result;
            }

            var appletParameters = {
                type:'application/x-java-applet;version=1.5',
                codebase:'.',
                code:'com.companylabs.customer70.client.customerAdminApplet.class',
                scriptable:'true',
                cache_option:'Plugin',
                cache_archive: getLibs().join(','),
                cache_version: getVersions().join(','),
                java_status_events:'true',
                mayscript:'mayscript',
                session_id:'<c:out value="${bean.sessionID}"/>',
                locale_info:'<customer:dateTimeFormatInfo appletParam="yes"/>',
                headless:'true',
                graph_reports: getGraphReportsAvailability(),
                browser: 'true'
            }

            function __readCookie__(name) {
	    		var nameEQ = name + "=";
	    		var ca = document.cookie.split(';');
	    		for (var i=0; i < ca.length; i++) {
	    			var c = ca[i];
	    			while (c.charAt(0)==' ') c = c.substring(1,c.length);
	    			if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	    		}
	    		return null;
	    	}

            <%--
            Applet communicates to the javascript via invoking bridge methods below using JSObject.call method.
            Methods that ends with "BridgeMethod" are defined in GWT application, but we have to define wrapper functions here because
            due to security restrictions or defect applet running on FireFox 19 can't call a javascript function that is registered from a GWT application.
            Link to the possible root cause https://bugzilla.mozilla.org/show_bug.cgi?id=839967
            --%>
            function onApplicationReady(currentSubSys) {
                try { window._onApplicationReady(currentSubSys); } catch(ex) { /*pass*/ }
            }

            function setApplicationTheme(theme) {
                try { window._setApplicationTheme(theme); } catch(ex) { /*pass*/ }
            }

            function getApplicationTheme() {
                try { return window._getApplicationTheme(); } catch(ex) { /*pass*/ }
            }

            function setSettings(settings) {
                try { window._setSettings(settings); } catch (ex) { /*pass*/ }
            }
        </script>

	<script type="text/javascript" src="s/s.nocache.js"></script>
    <iframe src="javascript:''" id="__gwt_historyFrame" tabIndex='-1' style="position:absolute;width:0;height:0;border:0"></iframe>
    <iframe src="javascript:''" id="__gwt_downloadFrame" tabIndex='-1' style="position:absolute;width:0;height:0;border:0"></iframe>
  </body>
  <script type="text/javascript">
    document.addEventListener('DOMContentLoaded', function cb() {
      console.log('DOMContentLoaded');
      var baseUri = window.location.protocol + '//' + window.location.host;
      var apiBasePath =  '/customer/new_api';
      console.log('apiBasePath',  apiBasePath);
      var userInfoEndpoint = '/user/info';

      function makeRequest(url, method, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.withCredentials = true;
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.setRequestHeader('browser', 'Internet Explorer');
        xhr.onreadystatechange = function () {
          if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            callback(xhr.responseText);
          }
        };

        xhr.send();
      }
      function saveSession(e){
        console.log(e);
        var timestamp = new Date().getTime();
        var url = baseUri + apiBasePath + userInfoEndpoint + '?timestamp=' + timestamp;
        console.log('saveSession')
        makeRequest(url, 'GET', function (response) {
          var res = JSON.parse(response);
          var userInfo = res.data;
          var uuidEndpoint = '/user/uuid/';
          if (userInfo.uuid) {
            window.location.href = 'microsoft-edge:' + baseUri + apiBasePath + uuidEndpoint + userInfo.uuid;
          }
        });
      };

      function isIE() {
        var userAgent = window.navigator.userAgent;
        return userAgent.indexOf('MSIE') !== -1 || userAgent.indexOf('Trident/') !== -1;
      }

      function waitUntilElementExists(callback) {
        var el = document.querySelectorAll('.GLV1IDKDBS .gwt-Button')[5];

        if (el){
          return callback(el);
        }

        setTimeout(function cb() {
          return waitUntilElementExists(callback)
        }, 500);
      }
      waitUntilElementExists(function cb() {
        if (isIE()) document.querySelectorAll('.GLV1IDKDBS .gwt-Button')[5].onclick=saveSession
      })
    }, false);
  </script>
</html>

</customer:processEvent>
