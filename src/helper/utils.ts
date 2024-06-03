import logger from './logger';
import { IBusinessUnits } from '../common/interfaces/config';
import { ISelected } from './schedule/SchUtils';

export enum NODE_ENV_TYPE {
  PROD = 'production',
  DEV = 'development',
}
const NODE_ENV = process.env.NODE_ENV as NODE_ENV_TYPE;

const baseUri = process.env.REACT_APP_BASE_URI || `${window.location.protocol}//${window.location.host}`;
const customerUri = process.env.REACT_APP_customer_URI || `${window.location.protocol}//${window.location.host}`;
const apiPrefix = process.env.REACT_APP_COMMON_API_PREFIX || '/customer';
const customerApiPrefix = process.env.REACT_APP_COMMON_customer_API_PREFIX || '/customer';
const scheduleBuilderEnabled = process.env.REACT_APP_SCHEDULE_BUILDER_ENABLED;
const betaFeaturesEnabled = process.env.REACT_APP_BETA_FEATURES_ENABLED;
const buildVersion = process.env.REACT_APP_BUILD_VERSION || 'unknown';

const requestChunkSize = process.env.REACT_APP_REQUEST_CHUNK_SIZE_IN_BYTES || 1000 * 1024; // 1 MB. Note: May be greater than this value. Since only one field is split into chunks
const GATEWAY_TIME_OUT = process.env.REACT_APP_GATEWAY_TIME_OUT || 100 * 1000; // default 100 sec
const GATEWAY_TIME_OUT_LARGE_REQ = process.env.REACT_APP_GATEWAY_TIME_OUT || 60 * 10 * 1000; // default 10 min

const CACHED_ENDPOINTS =
  process.env.REACT_APP_CACHED_ENDPOINTS ||
  'buildTreeWithTeamByBuAndSiteId,timezone,buildTreeWithAgents,findActivitySet,findActivities,findShifts,findExceptions,findTimeOffs';
const CACHE_TTL = process.env.REACT_APP_CACHE_TTL || 5 * 60 * 1000; // 5 min

const Utils = {
  baseUri,
  customerUri,
  apiPrefix,
  customerApiPrefix,
  cookieName: 'JSESSIONID',

  get NODE_ENV() {
    return NODE_ENV;
  },

  get CACHE_TTL() {
    return Number(CACHE_TTL);
  },

  get CACHED_ENDPOINTS() {
    return CACHED_ENDPOINTS.split(',').map(i => i.trim());
  },

  get GATEWAY_TIME_OUT() {
    return Number(GATEWAY_TIME_OUT);
  },

  get GATEWAY_TIME_OUT_LARGE_REQ() {
    return Number(GATEWAY_TIME_OUT_LARGE_REQ);
  },

  get BUILD_VERSION() {
    return buildVersion;
  },

  get REQUEST_CHUNK_SIZE_IN_BYTES() {
    return requestChunkSize;
  },

  get scheduleBuilderEnabled() {
    return this.checkEnvFlag(scheduleBuilderEnabled);
  },

  get betaFeaturesEnabled() {
    return this.checkEnvFlag(betaFeaturesEnabled);
  },
  getOS() {
    const userAgent = window.navigator.userAgent;
    const platform = window.navigator.platform;
    const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
    const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
    let os = 'Mac OS';

    if (macosPlatforms.includes(platform)) {
      os = 'Mac OS';
    } else if (iosPlatforms.includes(platform)) {
      os = 'iOS';
    } else if (windowsPlatforms.includes(platform)) {
      os = 'Windows';
    } else if (/Android/.test(userAgent)) {
      os = 'Android';
    } else if (!os && /Linux/.test(platform)) {
      os = 'Linux';
    }

    return os;
  },

  getFuncPerformance(name: string) {
    let time = Date.now();
    return () => {
      time = Date.now() - time;
      logger.debug(`function ${name}  performance: ${(time / 1000).toFixed(4)}s`);
    };
  },

  splitNames(fullNames: string) {
    const firstNames: string[] = [];
    const lastNames: string[] = [];

    fullNames.split(',').forEach(fullName => {
      const strArr = fullName.trim().split(' ');
      strArr.forEach(str => {
        firstNames.push(str);
        lastNames.push(str);
      });
      // firstNames.push(firstName.trim());
      // if (!lastName) return lastNames.push(firstName.trim());
      //
      // lastNames.push(lastName.trim());
    });

    return {
      firstNames: firstNames.join(','),
      lastNames: lastNames.join(','),
    };
  },

  findMatch(string: string, substrings: string) {
    if (!substrings) return false;

    const escapeRegExp = (str: string) => {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const parts = substrings
      .split(',')
      .flatMap(str => str)
      .map(str => escapeRegExp(str.trim()))
      .filter(str => !!str);

    const regex = new RegExp(`(${parts.join('|')})`, 'gi');

    return string.match(regex);
  },

  removeFirstDuplicatesByKey<T, K extends keyof T>(arr: T[], key: K) {
    const seen = new Set<T[K]>();
    return arr.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  },

  findItemAndIndex<T>(items: T[], callback: (item: T) => boolean): [T | null, number | null] {
    return items.reduce(
      (result: [T | null, number | null], item, index) => {
        if (!result[0] && callback(item)) {
          result = [item, index];
        }
        return result;
      },
      [null, null],
    );
  },

  removeTrailingComma(str: string) {
    return str.replace(/,+$/, '');
  },

  escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  markPartOfString(string: string, substrings: string) {
    if (!substrings || !string) return string;

    const escapeHtml = (str: string) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const parts = substrings
      .split(',')
      .flatMap(str => str.split(' '))
      .map(str => this.escapeRegExp(str.trim()))
      .filter(str => !!str);

    const regex = new RegExp(`(${parts.join('|')})`, 'gi');
    return string.replace(regex, match => `<mark>${escapeHtml(match)}</mark>`);
  },

  isAllArraysInObjEmpty(obj: any) {
    for (const prop in obj) {
      if (Array.isArray(obj[prop]) && obj[prop].length > 0) {
        return false;
      }
    }
    return true;
  },

  sortObjectByName(obj: { [key: string | number]: { name?: string; firstName?: string; lastName?: string } }) {
    const sortedKeys = Object.keys(obj).sort((a, b) => {
      let nameA = '';
      let nameB = '';
      if (obj[a].firstName || obj[b].firstName || obj[a].lastName || obj[b].lastName) {
        const fullNameA = `${obj[a].firstName || ''} ${obj[a].lastName || ''}`;
        const fullNameB = `${obj[b].firstName || ''} ${obj[b].lastName || ''}`;
        nameA = fullNameA.toUpperCase();
        nameB = fullNameB.toUpperCase();
      } else if (obj[a].name || obj[b].name) {
        nameA = obj[a].name?.toUpperCase() || '';
        nameB = obj[b].name?.toUpperCase() || '';
      }

      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });

    const items: string[] = [];
    sortedKeys.forEach(key => {
      items.push(key);
    });

    return items;
  },

  capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

  // TODO: remove this function after all usages will be replaced with stringChecker
  getParsedNum(value: string | number): number {
    return typeof value === 'string' ? parseInt(value) : value;
  },

  getBrowser(): 'Unknown' | 'Chrome' | 'Safari' | 'Edge' | 'Opera' | 'Internet Explorer' | 'Firefox' {
    const userAgent = window.navigator.userAgent;
    if (!userAgent) return 'Unknown';

    if (userAgent.includes('Firefox')) {
      return 'Firefox';
    } else if (userAgent.includes('Chrome')) {
      return 'Chrome';
    } else if (userAgent.includes('Safari')) {
      return 'Safari';
    } else if (userAgent.includes('Edge')) {
      return 'Edge';
    } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
      return 'Opera';
    } else if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) {
      return 'Internet Explorer';
    } else {
      return 'Unknown';
    }
  },

  setCookie(cName: string, cookie: string, path = '/customer') {
    const expires = new Date();
    expires.setDate(expires.getDate() + 1);
    document.cookie = `${cName}=${encodeURIComponent(cookie)};expires=${expires.toUTCString()};path=${path}`;
  },

  getCookie(name: string) {
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + '=')) {
        return decodeURIComponent(cookie.substring(name.length + 1));
      }
    }
    return null;
  },

  preventDefault(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    e.preventDefault();
  },

  searchValue<T>(input: T, searchedValue: T extends Array<infer U> ? U : T): boolean {
    if (Array.isArray(input)) {
      // If the input is an array, iterate over each element and check for a match
      for (let i = 0; i < input.length; i++) {
        if (input[i] === searchedValue) {
          return true; // Match found
        }
      }
    } else if (typeof input === 'number') {
      // If the input is a single number, check for a direct match
      if (input === searchedValue) {
        return true; // Match found
      }
    }

    return false; // No match found
  },

  findLastIndex<T>(items: T[], cb: (item: T) => boolean): number {
    for (let i = items.length - 1; i >= 0; i--) {
      if (cb(items[i])) {
        return i;
      }
    }
    return -1;
  },

  errorMessage(errorMsg: string, params: any[]): string {
    return params.reduce((acc, p, idx) => acc.replaceAll(`%${idx}`, String(p)), errorMsg);
  },

  to2Digits(time: number) {
    return ('0' + time).slice(-2);
  },

  stringChecker(id: string | number) {
    if (typeof id === 'string') {
      return parseInt(id);
    }
    return id;
  },

  getBooleanFromBitmask(bitmask: number, itemIndex: number): boolean {
    return ((bitmask >> itemIndex) & 1) === 1;
  },

  getBooleansFromBitmask(bitmask: number, size = 8): boolean[] {
    return Array(size)
      .fill(false)
      .map((b, idx) => this.getBooleanFromBitmask(bitmask, idx));
  },

  checkEnvFlag(variable: any | undefined): boolean {
    return variable && String(variable).toLowerCase() == 'true';
  },

  getFilteredSelectAgentsList(fetchedData: IBusinessUnits, selected: ISelected | IBusinessUnits): IBusinessUnits {
    return ((selected as ISelected).buId ?? Object.keys(selected as IBusinessUnits)).reduce(
      (acc, buId) => (fetchedData[buId] ? { ...acc, [buId]: fetchedData[buId] } : { ...acc }),
      {},
    );
  },

  isSomeCheckedInFilterData(filterData: IBusinessUnits): boolean {
    return Object.keys(filterData).reduce(
      (acc: boolean, buId: string) =>
        Boolean(
          acc ||
            filterData[buId].isAllChecked ||
            Object.keys(filterData[buId].sites).reduce(
              (acc: boolean, siteId: string) =>
                Boolean(
                  acc ||
                    filterData[buId].sites[siteId].isAllChecked ||
                    Object.keys(filterData[buId].sites[siteId].teams).reduce(
                      (acc: boolean, teamId: string) =>
                        Boolean(
                          acc ||
                            filterData[buId].sites[siteId].teams[teamId].isAllChecked ||
                            Object.keys(filterData[buId].sites[siteId].teams[teamId].agents).reduce(
                              (acc: boolean, agentId: string) =>
                                Boolean(acc || filterData[buId].sites[siteId].teams[teamId].agents[agentId].isChecked),
                              false,
                            ),
                        ),
                      false,
                    ),
                ),
              false,
            ),
        ),
      false,
    );
  },
};

export default Utils;
