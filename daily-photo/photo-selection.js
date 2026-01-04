/**
 * Script to select a daily photo for display from a directory in a GitHub repository.
 * The image should change each day. The order of images should be random, but no image should repeat until all images have been shown.
 */

const OWNER = "matchacakeroll";
const REPO = "Notion-widgets-and-stuff";
const PATH = "daily-photo/images";

/**
 * @return {Promise<Array<{type: string, size: number, name: string, path: string, sha: string, url: string, git_url: (string|null), html_url: (string|null), download_url: (string|null)}>>}
 */
async function fetchPhotoList() {
  const response = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`,
    {
      method: "GET",
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
        Accept: "application/vnd.github.object+json",
      },
    }
  );
  const json = await response.json();
  return json.entries;
}

/**
 * Seeded shuffle algorithm using Fisher-Yates shuffle
 * Produces a consistent shuffle based on a numeric seed
 * @param {Array} array - Array to shuffle
 * @param {number} seed - Numeric seed for deterministic shuffling
 * @return {Array} - New shuffled array
 */
function seededShuffle(array, seed) {
  const arr = [...array]; // Create a copy to avoid mutation
  let random = seed;

  // Linear congruential generator for seeded randomness
  const seededRandom = () => {
    random = (random * 9301 + 49297) % 233280;
    return random / 233280;
  };

  // Fisher-Yates shuffle with seeded randomness
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

/**
 * Get the current cycle number based on date and array length
 * Each cycle spans `arrayLength` days
 * @param {Date} date - Reference date
 * @param {number} arrayLength - Length of the array
 * @return {number} - Cycle seed for this date
 */
function getCycleSeed(date, arrayLength) {
  // Days since epoch
  const daysSinceEpoch = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  // Calculate which cycle we're in
  const cycleNumber = Math.floor(daysSinceEpoch / arrayLength);
  return cycleNumber;
}

/**
 * Get the day index within the current cycle
 * @param {Date} date - Reference date
 * @param {number} arrayLength - Length of the array
 * @return {number} - Index within current cycle (0 to arrayLength-1)
 */
function getDayInCycle(date, arrayLength) {
  const daysSinceEpoch = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  return daysSinceEpoch % arrayLength;
}

/**
 * Select an image from array based on current date
 * Order repeats every `arrayLength` days with different shuffle
 * @param {Array} array - Array of images
 * @param {Date} date - Reference date
 * @return {any} - Selected element from array
 */
function selectByDate(array, date) {
  if (array.length === 0) return null;

  const seed = getCycleSeed(date, array.length);
  const dayIndex = getDayInCycle(date, array.length);

  const shuffled = seededShuffle(array, seed);
  return shuffled[dayIndex];
}

function insertImageIntoDocument(imageUrl) {
  document.body.innerHTML = `<img src="${imageUrl}" alt="Daily Photo" style="max-width: 100%; height: auto;">`;
}

const currentDate = new Date();
fetchPhotoList().then((photos) => {
  const selectedPhoto = selectByDate(photos, currentDate);
  if (selectedPhoto && selectedPhoto.download_url) {
    insertImageIntoDocument(selectedPhoto.download_url);
  } else {
    console.error("No photo selected or download URL missing.");
  }
});
