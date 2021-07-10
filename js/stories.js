"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  //console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  return $(`
      <li id="${story.storyId}">
        <span class="favorite" aria-label="Favorite">&starf;</span>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
        <span aria-label="Delete" class="delete hidden">&#9746;</span>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    if (currentUser) {
      if (currentUser.favorites.some(f => f.storyId === story.storyId)) {
        $story.find("span").addClass("true");
      }
    }
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

/** Takes form input values & creates a new story */
async function createStory(evt) {
  evt.preventDefault();
  console.debug("addNewStory", evt);
  const title = $addStoryForm.find("#new-story-title").val();
  const author = $addStoryForm.find("#new-story-author").val();
  const url = $addStoryForm.find("#new-story-link").val();
  const story = await storyList.addStory(currentUser, {title, author, url});
  const $story = generateStoryMarkup(story);
  $allStoriesList.append($story);
  $addStoryForm.hide();
  $allStoriesList.show();
}

$addStoryForm.on("submit", createStory);

/** provides favorite & unfavorite functionality */
async function storyFavoriteClick() {
  console.debug("storyFavoriteClick");
  if (!currentUser) return;
  const $span = $(this);
  const eleId = $span.parent().attr("id");
  const selectedStory = storyList.stories.find(s => s.storyId === eleId);
  $span.toggleClass("true");
  const add = $span.hasClass("true");
  await currentUser.toggleFavoriteStory(selectedStory, add);
}

$allStoriesList.on("click", ".favorite", storyFavoriteClick);

/** unhides all the stories */
function unhideStories() {
  $allStoriesList.show();
  $allStoriesList.find("li")
  .toArray().forEach(s => {
    const $s = $(s);
    $s.show();
  });
}

/** displays only favorited stories */
function showFavoriteStories() {
  console.debug("showFavoriteStories");
  $("span.delete").addClass("hidden");
  unhideStories();
  for (let storyEle of $allStoriesList.find(".favorite")) {
    const $storyEle = $(storyEle);
    if (!$storyEle.hasClass("true")) $storyEle.parent().hide();
  }
}

$favoritesButton.on("click", showFavoriteStories);

/** displays only user uploaded stories */
function showUserUploadedStories() {
  console.debug("showUserUploadedStories");
  unhideStories();
  for (let storyEle of $allStoriesList.find("li")) {
    const $storyEle = $(storyEle);
    if (!currentUser.ownStories.some(o => o.storyId === storyEle.id)) {
      $storyEle.hide();
    }
  }
  $("span.delete").removeClass("hidden").on("click", currentUser.deleteStory);
}

$uploadsButton.on("click", showUserUploadedStories);
