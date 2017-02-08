<?php

/*
 * This file is part of the Claroline Connect package.
 *
 * (c) Claroline Consortium <consortium@claroline.net>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Claroline\CoreBundle\Library\Configuration;

class PlatformConfiguration
{
    const REGISTRATION_MAIL_VALIDATION_NONE = 0;
    const REGISTRATION_MAIL_VALIDATION_PARTIAL = 1;
    const REGISTRATION_MAIL_VALIDATION_FULL = 2;
    const DEFAULT_REDIRECT_OPTION = 'DESKTOP';
    public static $REDIRECT_OPTIONS = [
        'DESKTOP' => 'DESKTOP',
        'LAST' => 'LAST',
        'URL' => 'URL',
        'WORKSPACE_TAG' => 'WORKSPACE_TAG',
    ];

    private $name;
    private $nameActive;
    private $supportEmail;
    private $selfRegistration;
    private $localeLanguage;
    private $theme;
    private $footer;
    private $role;
    private $termsOfService;
    private $cookieLifetime;
    private $mailerTransport;
    private $mailerHost;
    private $mailerPort;
    private $mailerEncryption;
    private $mailerUsername;
    private $mailerPassword;
    private $mailerAuthMode;
    private $googleMetaTag;
    private $redirectAfterLoginOption;
    private $redirectAfterLoginUrl;
    private $sessionStorageType;
    private $sessionDbTable;
    private $sessionDbIdCol;
    private $sessionDbDataCol;
    private $sessionDbTimeCol;
    private $sessionDbDsn;
    private $sessionDbUser;
    private $sessionDbPassword;
    private $formCaptcha;
    private $platformLimitDate;
    private $platformInitDate;
    private $accountDuration;
    private $usernameRegex;
    private $usernameErrorMessage;
    private $anonymousPublicProfile;
    private $homeMenu;
    private $footerLogin;
    private $footerWorkspaces;
    private $headerLocale;
    private $portfolioUrl;
    private $isNotificationActive;
    private $maxStorageSize;
    private $maxUploadResources;
    private $repositoryApi;
    private $useRepositoryTest;
    private $workspaceMaxUsers;
    private $autoLogginAfterRegistration;
    private $registrationMailValidation;
    private $showHelpButton;
    private $helpUrl;
    private $registerButtonAtLogin;
    private $sendMailAtWorkspaceRegistration;
    private $locales;
    private $domainName;
    private $defaultWorkspaceTag;
    private $isPdfExportActive;
    private $googleGeocodingClientId;
    private $googleGeocodingSignature;
    private $googleGeocodingKey;
    private $formHoneypot;
    private $sslEnabled;
    private $enableRichTextFileImport;
    private $loginTargetRoute;
    private $enableOpengraph;
    private $tmpDir;
    /**
     * @param mixed $sessionDbDataCol
     */
    public function setSessionDbDataCol($sessionDbDataCol)
    {
        $this->sessionDbDataCol = $sessionDbDataCol;
    }

    /**
     * @return mixed
     */
    public function getSessionDbDataCol()
    {
        return $this->sessionDbDataCol;
    }

    /**
     * @param mixed $sessionDbIdCol
     */
    public function setSessionDbIdCol($sessionDbIdCol)
    {
        $this->sessionDbIdCol = $sessionDbIdCol;
    }

    /**
     * @return mixed
     */
    public function getSessionDbIdCol()
    {
        return $this->sessionDbIdCol;
    }

    /**
     * @param mixed $sessionDbPassword
     */
    public function setSessionDbPassword($sessionDbPassword)
    {
        $this->sessionDbPassword = $sessionDbPassword;
    }

    /**
     * @return mixed
     */
    public function getSessionDbPassword()
    {
        return $this->sessionDbPassword;
    }

    /**
     * @param mixed $sessionDbTable
     */
    public function setSessionDbTable($sessionDbTable)
    {
        $this->sessionDbTable = $sessionDbTable;
    }

    /**
     * @return mixed
     */
    public function getSessionDbTable()
    {
        return $this->sessionDbTable;
    }

    /**
     * @param mixed $sessionDbTimeCol
     */
    public function setSessionDbTimeCol($sessionDbTimeCol)
    {
        $this->sessionDbTimeCol = $sessionDbTimeCol;
    }

    /**
     * @return mixed
     */
    public function getSessionDbTimeCol()
    {
        return $this->sessionDbTimeCol;
    }

    /**
     * @param mixed $sessionDbUser
     */
    public function setSessionDbUser($sessionDbUser)
    {
        $this->sessionDbUser = $sessionDbUser;
    }

    /**
     * @return mixed
     */
    public function getSessionDbUser()
    {
        return $this->sessionDbUser;
    }

    /**
     * @param mixed $sessionStorageType
     */
    public function setSessionStorageType($sessionStorageType)
    {
        $this->sessionStorageType = $sessionStorageType;
    }

    /**
     * @return mixed
     */
    public function getSessionStorageType()
    {
        return $this->sessionStorageType;
    }

    /**
     * @param mixed $sessionDbDsn
     */
    public function setSessionDbDsn($sessionDbDsn)
    {
        $this->sessionDbDsn = $sessionDbDsn;
    }

    /**
     * @return mixed
     */
    public function getSessionDbDsn()
    {
        return $this->sessionDbDsn;
    }

    /**
     * @param mixed $role
     */
    public function setRole($role)
    {
        $this->role = $role;
    }

    /**
     * @return mixed
     */
    public function getRole()
    {
        return $this->role;
    }

    public function getSelfRegistration()
    {
        return $this->selfRegistration;
    }

    public function setSelfRegistration($selfRegistration)
    {
        $this->selfRegistration = $selfRegistration;
    }

    public function getLocaleLanguage()
    {
        return $this->localeLanguage;
    }

    public function setLocaleLanguage($localeLanguage)
    {
        $this->localeLanguage = $localeLanguage;
    }

    public function getTheme()
    {
        return $this->theme;
    }

    public function setTheme($theme)
    {
        $this->theme = $theme;
    }

    public function getName()
    {
        return $this->name;
    }

    public function setName($name)
    {
        $this->name = $name;
    }

    public function getSupportEmail()
    {
        return $this->supportEmail;
    }

    public function setSupportEmail($email)
    {
        $this->supportEmail = $email;
    }

    public function getFooter()
    {
        return $this->footer;
    }

    public function setFooter($footer)
    {
        $this->footer = $footer;
    }

    public function setDefaultRole($role)
    {
        $this->role = $role;
    }

    public function getDefaultRole()
    {
        return $this->role;
    }

    public function setTermsOfService($termsOfService)
    {
        $this->termsOfService = $termsOfService;
    }

    public function getTermsOfService()
    {
        return $this->termsOfService;
    }

    public function setCookieLifetime($time)
    {
        $this->cookieLifetime = $time;
    }

    public function getCookieLifetime()
    {
        return $this->cookieLifetime;
    }

    public function getMailerTransport()
    {
        return $this->mailerTransport;
    }

    public function setMailerTransport($mailerTransport)
    {
        $this->mailerTransport = $mailerTransport;
    }

    public function setMailerAuthMode($mailerAuthMode)
    {
        $this->mailerAuthMode = $mailerAuthMode;
    }

    public function getMailerAuthMode()
    {
        return $this->mailerAuthMode;
    }

    public function setMailerEncryption($mailerEncryption)
    {
        $this->mailerEncryption = $mailerEncryption;
    }

    public function getMailerEncryption()
    {
        return $this->mailerEncryption;
    }

    public function setMailerHost($mailerHost)
    {
        $this->mailerHost = $mailerHost;
    }

    public function getMailerHost()
    {
        return $this->mailerHost;
    }

    public function setMailerPassword($mailerPassword)
    {
        $this->mailerPassword = $mailerPassword;
    }

    public function getMailerPassword()
    {
        return $this->mailerPassword;
    }

    public function setMailerPort($mailerPort)
    {
        $this->mailerPort = $mailerPort;
    }

    public function getMailerPort()
    {
        return $this->mailerPort;
    }

    public function setMailerUsername($mailerUsername)
    {
        $this->mailerUsername = $mailerUsername;
    }

    public function getMailerUsername()
    {
        return $this->mailerUsername;
    }

    public function setGoogleMetaTag($googleMetaTag)
    {
        $this->googleMetaTag = $googleMetaTag;
    }

    public function getGoogleMetaTag()
    {
        return $this->googleMetaTag;
    }

    public function setRedirectAfterLoginOption($redirectAfterLoginOption)
    {
        $this->redirectAfterLoginOption = $redirectAfterLoginOption;
    }

    public function getRedirectAfterLoginOption()
    {
        return $this->redirectAfterLoginOption;
    }

    public function setRedirectAfterLoginUrl($redirectAfterLoginUrl)
    {
        $this->redirectAfterLoginUrl = $redirectAfterLoginUrl;
    }

    public function getRedirectAfterLoginUrl()
    {
        return $this->redirectAfterLoginUrl;
    }

    /**
     * @param bool $nameActive
     */
    public function setNameActive($nameActive)
    {
        $this->nameActive = $nameActive;
    }

    /**
     * @return bool
     */
    public function isNameActive()
    {
        return $this->nameActive;
    }

    public function setFormCaptcha($boolean)
    {
        $this->formCaptcha = $boolean;
    }

    public function getFormCaptcha()
    {
        return $this->formCaptcha;
    }

    public function setPlatformLimitDate($platformLimitDate)
    {
        $this->platformLimitDate = $platformLimitDate;
    }

    public function getPlatformLimitDate()
    {
        return $this->platformLimitDate;
    }

    public function setPlatformInitDate($platformInitDate)
    {
        $this->platformInitDate = $platformInitDate;
    }

    public function getPlatformInitDate()
    {
        return $this->platformInitDate;
    }

    public function setAccountDuration($accountDuration)
    {
        $this->accountDuration = $accountDuration;
    }

    public function getAccountDuration()
    {
        return $this->accountDuration;
    }

    public function setUsernameRegex($regex)
    {
        $this->regex = $regex;
    }

    public function getUsernameRegex()
    {
        return $this->regex;
    }

    public function setAnonymousPublicProfile($boolean)
    {
        $this->anonymousPublicProfile = $boolean;
    }

    public function getAnonymousPublicProfile()
    {
        return $this->anonymousPublicProfile;
    }

    public function setHomeMenu($id)
    {
        $this->homeMenu = $id;
    }

    public function getHomeMenu()
    {
        return $this->homeMenu;
    }

    public function setFooterLogin($boolean)
    {
        $this->footerLogin = $boolean;
    }

    public function getFooterLogin()
    {
        return $this->footerLogin;
    }

    public function setFooterWorkspaces($boolean)
    {
        $this->footerWorkspaces = $boolean;
    }

    public function getFooterWorkspaces()
    {
        return $this->footerWorkspaces;
    }

    public function setHeaderLocale($boolean)
    {
        $this->headerLocale = $boolean;
    }

    public function getHeaderLocale()
    {
        return $this->headerLocale;
    }

    /**
     * @return mixed
     */
    public function getPortfolioUrl()
    {
        return $this->portfolioUrl;
    }

    /**
     * @param mixed $portfolioUrl
     *
     * @return PlatformConfiguration
     */
    public function setPortfolioUrl($portfolioUrl)
    {
        $this->portfolioUrl = $portfolioUrl;

        return $this;
    }

    public function getIsNotificationActive()
    {
        return $this->isNotificationActive;
    }

    public function setIsNotificationActive($bool)
    {
        $this->isNotificationActive = $bool;
    }

    public function setMaxStorageSize($maxSize)
    {
        $this->maxStorageSize = $maxSize;
    }

    public function getMaxStorageSize()
    {
        return $this->maxStorageSize;
    }

    public function setMaxUploadResources($maxSize)
    {
        $this->maxUploadResources = $maxSize;
    }

    public function getMaxUploadResources()
    {
        return $this->maxUploadResources;
    }

    public function setRepositoryApi($url)
    {
        $this->repositoryApi = $url;
    }

    public function getRepositoryApi()
    {
        return $this->repositoryApi;
    }

    public function setWorkspaceMaxUsers($wsMaxUsers)
    {
        $this->workspaceMaxUsers = $wsMaxUsers;
    }

    public function getWorkspaceMaxUsers()
    {
        return $this->workspaceMaxUsers;
    }

    public function setAutoLogginAfterRegistration($boolean)
    {
        $this->autoLogginAfterRegistration = $boolean;
    }

    public function getAutoLogginAfterRegistration()
    {
        return $this->autoLogginAfterRegistration;
    }

    public function setRegistrationMailValidation($boolean)
    {
        $this->registrationMailValidation = $boolean;
    }

    public function getRegistrationMailValidation()
    {
        return $this->registrationMailValidation;
    }

    public function setShowHelpButton($showHelpButton)
    {
        $this->showHelpButton = $showHelpButton;
    }

    public function getShowHelpButton()
    {
        return $this->showHelpButton;
    }

    public function setHelpUrl($helpUrl)
    {
        $this->helpUrl = $helpUrl;
    }

    public function getHelpUrl()
    {
        return $this->helpUrl;
    }

    public function getRegisterButtonAtLogin()
    {
        return $this->registerButtonAtLogin;
    }

    public function setRegisterButtonAtLogin($registerButtonAtLogin)
    {
        $this->registerButtonAtLogin = $registerButtonAtLogin;
    }

    public function setUseRepositoryTest($bool)
    {
        $this->useRepositoryTest = $bool;
    }

    public function getUseRepositoryTest()
    {
        return $this->useRepositoryTest;
    }

    public function getSendMailAtWorkspaceRegistration()
    {
        return $this->sendMailAtWorkspaceRegistration;
    }

    public function setSendMailAtWorkspaceRegistration($sendMailAtWorkspaceRegistration)
    {
        $this->sendMailAtWorkspaceRegistration = $sendMailAtWorkspaceRegistration;
    }

    public function setLocales($locales)
    {
        $this->locales = $locales;
    }

    public function getLocales()
    {
        return $this->locales;
    }

    public function setDomainName($domainName)
    {
        $this->domainName = $domainName;
    }

    public function getDomainName()
    {
        return $this->domainName;
    }

    public function setDefaultWorkspaceTag($defaultWorkspaceTag)
    {
        $this->defaultWorkspaceTag = $defaultWorkspaceTag;
    }

    public function getDefaultWorkspaceTag()
    {
        return $this->defaultWorkspaceTag;
    }

    public function getIsPdfExportActive()
    {
        return $this->isPdfExportActive;
    }

    public function setIsPdfExportActive($isPdfExportActive)
    {
        $this->isPdfExportActive = $isPdfExportActive;

        return $this;
    }

    public function setGoogleGeocodingClientId($id)
    {
        $this->googleGeocodingClientId = $id;
    }

    public function getGoogleGeocodingClientId()
    {
        return $this->googleGeocodingClientId;
    }

    public function setGoogleGeocodingSignature($sig)
    {
        $this->googleGeocodingSignature = $sig;
    }

    public function getGoogleGeocodingSignature()
    {
        return $this->googleGeocodingSignature;
    }

    public function setGoogleGeocodingKey($key)
    {
        $this->googleGeocodingKey = $key;
    }

    public function getGoogleGeocodingKey()
    {
        return $this->googleGeocodingKey;
    }

    public function setFormHoneypot($bool)
    {
        $this->formHoneypot = $bool;
    }

    public function getFormHoneypot()
    {
        return $this->formHoneypot;
    }

    public function setSslEnabled($sslEnabled)
    {
        $this->sslEnabled = $sslEnabled;
    }

    public function getSslEnabled()
    {
        return $this->sslEnabled;
    }

    public function setEnableRichTextFileImport($bool)
    {
        $this->enableRichTextFileImport = $bool;
    }

    public function getEnableRichTextFileImport()
    {
        return $this->enableRichTextFileImport;
    }

    public function setLoginTargetRoute($loginTargetRoute)
    {
        $this->loginTargetRoute = $loginTargetRoute;
    }

    public function getLoginTargetRoute()
    {
        return $this->loginTargetRoute;
    }

    public function setEnableOpengraph($bool)
    {
        $this->enableOpengraph = $bool;
    }

    public function getEnableOpengraph()
    {
        return $this->enableOpengraph;
    }

    public function setTmpDir($tmpDir)
    {
        $this->tmpDir = $tmpDir;
    }

    public function getTmpDir()
    {
        return $this->tmpDir;
    }
}
