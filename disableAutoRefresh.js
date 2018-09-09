console.log("disable auto refresh.");

if (typeof window.pageRefreshDisable == "function") {
  window.pageRefreshDisable();
  console.log("auto refresh disabled.");
} else {
  console.log("failed to disabled auto refresh.");
}
