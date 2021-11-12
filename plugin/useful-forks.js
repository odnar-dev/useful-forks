let GITHUB_ACCESS_TOKEN = ""

const UF_ID_WRAPPER = 'useful_forks_wrapper';
const UF_ID_TITLE   = 'useful_forks_title';
const UF_ID_MSG     = 'useful_forks_msg';
const UF_ID_DATA    = 'useful_forks_data';
const UF_ID_TABLE   = 'useful_forks_table';

const svg_literal_fork = '<svg class="octicon octicon-repo-forked v-align-text-bottom" viewBox="0 0 10 16" width="10" height="16" aria-hidden="true" role="img"><title>Amount of forks, or name of the repository</title><path fill-rule="evenodd" d="M8 1a1.993 1.993 0 00-1 3.72V6L5 8 3 6V4.72A1.993 1.993 0 002 1a1.993 1.993 0 00-1 3.72V6.5l3 3v1.78A1.993 1.993 0 005 15a1.993 1.993 0 001-3.72V9.5l3-3V4.72A1.993 1.993 0 008 1zM2 4.2C1.34 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm3 10c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm3-10c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z"></path></svg>';
const svg_literal_star = '<svg class="octicon octicon-star v-align-text-bottom" viewBox="0 0 14 16" width="14" height="16" aria-label="star" role="img"><title>Amount of stars</title><path fill-rule="evenodd" d="M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 14l-.93-4.74L14 6z"></path></svg>';
const svg_literal_date = '<svg class="octicon octicon-history text-gray" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" role="img"><title>Date of the most recent push in ANY branch of the repository</title><path fill-rule="evenodd" d="M1.643 3.143L.427 1.927A.25.25 0 000 2.104V5.75c0 .138.112.25.25.25h3.646a.25.25 0 00.177-.427L2.715 4.215a6.5 6.5 0 11-1.18 4.458.75.75 0 10-1.493.154 8.001 8.001 0 101.6-5.684zM7.75 4a.75.75 0 01.75.75v2.992l2.028.812a.75.75 0 01-.557 1.392l-2.5-1A.75.75 0 017 8.25v-3.5A.75.75 0 017.75 4z"></path></svg>';

const UF_MSG_HEADER       = "<b>Useful forks</b>";
const UF_MSG_NO_FORKS     = "No one forked this specific repository.";
const UF_MSG_SCANNING     = "Currently scanning all the forks.";
const UF_MSG_ERROR        = "There seems to have been an error while scanning forks.";
const UF_MSG_EMPTY_FILTER = "All the forks have been filtered out: you can now rest easy!";
const UF_MSG_API_RATE     = "<b>Exceeded GitHub API rate-limits.</b>";
const UF_TABLE_SEPARATOR  = "｜";

const FORKS_PER_PAGE = 100; // enforced by GitHub API

let REQUESTS_COUNTER = 0; // to know when it's over


function allRequestsAreDone() {
  return REQUESTS_COUNTER <= 0;
}

function checkIfAllRequestsAreDone() {
  if (allRequestsAreDone()) {
    sortTable();
  }
}

function getOnlyDate(full) {
  return full.split('T')[0];
}

function extract_username_from_fork(combined_name) {
  return combined_name.split('/')[0];
}

function badge_width(number) {
  return 70 * number.toString().length; // magic number 70 extracted from analyzing 'shields.io'
}

/** Credits to https://shields.io/ */
function ahead_badge(amount) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="88" height="24" role="img"><title>How far ahead this fork\'s default branch is compared to its parent\'s default branch</title><linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".1" stop-color="#aaa" stop-opacity=".1"/><stop offset=".9" stop-color="#000" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient><clipPath id="r"><rect width="88" height="18" rx="4" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="43" height="18" fill="#555"/><rect x="43" width="45" height="18" fill="#007ec6"/><rect width="88" height="18" fill="url(#s)"/></g><g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110"><text aria-hidden="true" x="225" y="140" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="330">ahead</text><text x="225" y="130" transform="scale(.1)" fill="#fff" textLength="330">ahead</text><text x="645" y="130" transform="scale(.1)" fill="#fff" textLength="' + badge_width(amount) + '">' + amount + '</text></g></svg>';
}

/** Credits to https://shields.io/ */
function behind_badge(amount) {
  const color = amount === 0 ? '#4c1' : '#007ec6'; // green only when not behind, blue otherwise
  return '<svg xmlns="http://www.w3.org/2000/svg" width="92" height="24" role="img"><title>How far behind this fork\'s default branch is compared to its parent\'s default branch</title><linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".1" stop-color="#aaa" stop-opacity=".1"/><stop offset=".9" stop-color="#000" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient><clipPath id="r"><rect width="92" height="18" rx="4" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="47" height="18" fill="#555"/><rect x="47" width="45" height="18" fill="'+ color +'"/><rect width="92" height="18" fill="url(#s)"/></g><g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110"><text aria-hidden="true" x="245" y="140" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="370">behind</text><text x="245" y="130" transform="scale(.1)" fill="#fff" textLength="370">behind</text><text x="685" y="130" transform="scale(.1)" fill="#fff" textLength="' + badge_width(amount) + '">' + amount + '</text></g></svg>';
}

function getElementById_$(id) {
  return $('#' + id);
}

function isEmpty(aList) {
  return (!aList || aList.length === 0);
}

function setMsg(msg) {
  getElementById_$(UF_ID_MSG).html(msg);
}

function clearMsg() {
  setMsg("");
}

function getTableBody() {
  return getElementById_$(UF_ID_TABLE).find($("tbody"));
}

function getTdValue(rows, index, col) {
  return Number(rows.item(index).getElementsByTagName('td').item(col).getAttribute("value"));
}

function sortTable() {
  sortTableColumn(UF_ID_TABLE, 1);
}

/** 'sortColumn' index starts at 0.   https://stackoverflow.com/a/37814596/9768291 */
function sortTableColumn(table_id, sortColumn){
  let tableData = document.getElementById(table_id).getElementsByTagName('tbody').item(0);
  let rows = tableData.getElementsByTagName('tr');
  for(let i = 0; i < rows.length - 1; i++) {
    for(let j = 0; j < rows.length - (i + 1); j++) {
      if(getTdValue(rows, j, sortColumn) < getTdValue(rows, j+1, sortColumn)) {
        tableData.insertBefore(rows.item(j+1), rows.item(j));
      }
    }
  }
}

/** The secondary request which appends the badges. */
function commits_count(request, table_body, table_row, pushed_at) {
  return () => {
    const response = JSON.parse(request.responseText);

    if (response.total_commits === 0) {
      table_row.remove();
      if (table_body.children().length === 0) {
        setMsg(UF_MSG_EMPTY_FILTER);
      }
    } else {
      table_row.append(
          $('<td>').html(UF_TABLE_SEPARATOR),
          $('<td>', {class: "uf_badge"}).html(ahead_badge(response.ahead_by)),
          $('<td>').html(UF_TABLE_SEPARATOR),
          $('<td>', {class: "uf_badge"}).html(behind_badge(response.behind_by)),
          $('<td>').html(UF_TABLE_SEPARATOR + svg_literal_date + ' ' + pushed_at)
      );
    }

    /* Detection of final request. */
    REQUESTS_COUNTER--;
    checkIfAllRequestsAreDone();
  }
}

/** To remove erroneous repos. */
function commits_count_failure(table_row) {
  return () => {
    table_row.remove();

    /* Detection of final request. */
    REQUESTS_COUNTER--;
    checkIfAllRequestsAreDone();
  }
}

/** To use the Access Token with a request. */
function authenticatedRequestHeaderFactory(url) {
  let request = new XMLHttpRequest();
  request.open('GET', url);
  request.setRequestHeader("Accept", "application/vnd.github.v3+json");
  request.setRequestHeader("Authorization", "token " + GITHUB_ACCESS_TOKEN);
  return request;
}

/** Defines the default behavior of a request. */
function onreadystatechangeFactory(xhr, successFn, failureFn) {
  return () => {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        successFn();
      } else if (xhr.status === 403) {
        console.warn('Looks like the rate-limit was exceeded.');
        setMsg(UF_MSG_API_RATE);
      } else {
        console.warn('GitHub API returned status:', xhr.status);
        failureFn();
      }
    } else {
      // Request is still in progress
    }
  };
}

/** Fills the first part of the rows. */
function build_fork_element_html(table_body, combined_name, num_stars, num_forks) {
  const NEW_ROW = $('<tr>', {id: extract_username_from_fork(combined_name), class: "useful_forks_repo"});
  table_body.append(
      NEW_ROW.append(
          $('<td>').html(svg_literal_fork + ` <a href="https://github.com/${combined_name}" target="_blank" rel="noopener noreferrer">${combined_name}</a>`),
          $('<td>').html(UF_TABLE_SEPARATOR + svg_literal_star + ' x ' + num_stars).attr("value", num_stars),
          $('<td>').html(UF_TABLE_SEPARATOR + svg_literal_fork + ' x ' + num_forks).attr("value", num_forks)
      )
  );
  return NEW_ROW;
}

/** Prepares, appends, and updates dynamically a table row. */
function add_fork_elements(forkdata_array, user, repo, parentDefaultBranch) {
  if (isEmpty(forkdata_array))
    return;

  clearMsg();

  let table_body = getTableBody();
  for (let i = 0; i < forkdata_array.length; ++i) {
    const currFork = forkdata_array[i];

    /* Basic data (stars, watchers, forks). */
    const NEW_ROW = build_fork_element_html(table_body, currFork.full_name, currFork.stargazers_count, currFork.forks_count);

    /* Commits diff data (ahead/behind). */
    const API_REQUEST_URL = `https://api.github.com/repos/${user}/${repo}/compare/${parentDefaultBranch}...${extract_username_from_fork(currFork.full_name)}:${currFork.default_branch}`;
    let request = authenticatedRequestHeaderFactory(API_REQUEST_URL);
    request.onreadystatechange = onreadystatechangeFactory(request, commits_count(request, table_body, NEW_ROW, getOnlyDate(currFork.pushed_at)), commits_count_failure(NEW_ROW));
    request.send();

    /* Forks of forks. */
    if (currFork.forks_count > 0) {
      request_fork_page(1, currFork.owner.login, currFork.name, currFork.default_branch);
    }
  }
}

/** Paginated request. Pages index start at 1. */
function request_fork_page(page_number, user, repo, defaultBranch) {
  const API_REQUEST_URL = `https://api.github.com/repos/${user}/${repo}/forks?sort=stargazers&per_page=${FORKS_PER_PAGE}&page=${page_number}`;
  let request = authenticatedRequestHeaderFactory(API_REQUEST_URL);
  request.onreadystatechange = onreadystatechangeFactory(request,
      () => {
        const response = JSON.parse(request.responseText);

        /* On empty response (repo has not been forked). */
        if (isEmpty(response))
          return;

        REQUESTS_COUNTER += response.length; // to keep track of when the query ends

        /* Pagination (beyond 100 forks). */
        const link_header = request.getResponseHeader("link");
        if (link_header) {
          let contains_next_page = link_header.indexOf('>; rel="next"');
          if (contains_next_page !== -1) {
            request_fork_page(++page_number, user, repo, defaultBranch);
          }
        }

        sortTable();

        /* Populate the table. */
        add_fork_elements(response, user, repo, defaultBranch);
      },
      () => {
        setMsg(UF_MSG_ERROR);
        checkIfAllRequestsAreDone();
      });
  request.send();
}

/** Updates header with Queried Repo info, and initiates recursive forks search */
function initial_request(user, repo) {
  const API_REQUEST_URL = `https://api.github.com/repos/${user}/${repo}`;
  let request = authenticatedRequestHeaderFactory(API_REQUEST_URL);
  request.onreadystatechange = onreadystatechangeFactory(request,
      () => {
        const response = JSON.parse(request.responseText);

        if (isEmpty(response))
          return;

        if (response.forks_count > 0) {
          request_fork_page(1, user, repo, response.default_branch);
        } else {
          setMsg(UF_MSG_NO_FORKS);
          enableQueryFields();
        }
      },
      () => setMsg(UF_MSG_ERROR)
  );
  request.send();
}

function prepare_display() {
  $('#network').prepend(
      $('<div>', {id: UF_ID_WRAPPER, class: "float-right"}).append(
          $('<h4>',  {id: UF_ID_TITLE, html: UF_MSG_HEADER}),
          $('<div>', {id: UF_ID_MSG, html: UF_MSG_SCANNING}),
          $('<div>', {id: UF_ID_DATA}).append(
              $('<table>', {id: UF_ID_TABLE}).append(
                  $('<tbody>')
              )
          )
      )
  );
}

/** To determine if Dark Mode is enabled. */
function getGitHubTheme() {
  let colorMode = document.querySelector('[data-color-mode]')?.dataset.colorMode;
  if (colorMode === 'dark') {
    return "dark";
  } else if (colorMode === 'auto') {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return "dark";
    }
  }
  return "light"; // default
}

function add_css() {
  const GITHUB_THEME = getGitHubTheme();
  const TR_HOVER_COLOR = GITHUB_THEME === "dark" ? '#2f353e' : '#e2e2e2';
  const TR_BG_COLOR = GITHUB_THEME === "dark" ? '#161b22' : '#f5f5f5';
  const ADDITIONAL_CSS = `
    .uf_badge svg {
      display: table-cell;
      padding-top: 3px;
    }
    tr:hover {background-color: ${TR_HOVER_COLOR} !important;}
    tr:nth-child(even) {background-color: ${TR_BG_COLOR};}
    #${UF_ID_MSG} {color: red;}
    `;

  let styleSheet = document.createElement('style');
  styleSheet.type = "text/css";
  styleSheet.innerText = ADDITIONAL_CSS;
  document.head.appendChild(styleSheet);
}

/** Entry point. */
function init() {
  const pathComponents = window.location.pathname.split('/');
  if (pathComponents[4] === "members") {
    const user = pathComponents[1], repo = pathComponents[2];
    add_css();
    prepare_display();
    initial_request(user, repo);
  }
}

init();

//When navigating between Insights pages, URL is manipulated through PJAX.
document.addEventListener('pjax:end', init);