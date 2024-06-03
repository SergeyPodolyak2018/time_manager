<%@ page import="com.companylabs.customer70.server.filters.RedirectUriHelper" %>
<%@ page import="com.companylabs.customer70.server.logging.LoggerImpl" %>
<%@include file="includes/prefix.jsp"%>
<%@include file="includes/injectThemeName.jsp"%>
<%
    RedirectUriHelper helper = new RedirectUriHelper(LoggerImpl.getLogger());
    pageContext.setAttribute("serverBasePath", helper.getRedirectUri(request));
%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=<customer:emulateIEVersion />">
    <meta http-equiv="Content-Security-Policy" content="style-src 'self' 'unsafe-inline'; object-src 'self'; frame-src 'self' 'unsafe-inline'; form-action 'self';"/>
  <meta http-equiv="cache-control" content="no-cache">

  <base href="<%= request.getContextPath() %>/NewSupervisor" />
    <link type="text/css" rel="stylesheet" href="themes/<c:out value="${theme}"/>/loading-spinner.css">
    <link rel="stylesheet" type="text/css" rel="stylesheet" href="themes/<c:out value="${theme}"/>/sprite_60fps.css"/>
    <link rel="shortcut icon" href="<%= request.getContextPath() %>/favicon.ico"/>
    <title><customer:translate  language="${pageContext.request.locale}" name="S_SUPERVISOR_TITLE"/></title>
    <script>
        var baseUri = window.location.protocol + '//' + window.location.host;
        var apiBasePath = '/customer/new_api';
        var userInfoEndpoint = '/user/info';

        function isIE() {
          var userAgent = window.navigator.userAgent;
          return userAgent.indexOf('MSIE') !== -1 || userAgent.indexOf('Trident/') !== -1;
        }

      </script>
    <script>
  window.onload = function() {
	  document.getElementById("loading").style.display = 'none';
  };
</script>
</head>

<body class="loading">
        <div id="loading">
           <div class="spinner-container fast-spinner">
                <div class="shapeshifter play" style="background-image: url(themes/standard/images/sprite_60fps.svg)"></div>
            </div>
        </div>

<script type="text/javascript">
    var serverBasePath = '${serverBasePath}';
    <customer:dateTimeFormatInfo useJavaDateTimePatterns="true" varName="comcompanyDateTimeFormatInfo" />
    <customer:numberConstants varName="comcompanyNumberFormatInfo" />
</script>
<div id="app"></div>
</body>
<script>
  if (!isIE()) {
    var script = document.createElement('script');
    var timestamp = new Date().getTime()
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.src = "<%= request.getContextPath() %>/customer-ui-bundle/index.js?timestamp=" + timestamp;
    document.body.appendChild(script);
  }
</script>
</html>
