const { ajax } = require("rxjs/ajax");
const { forkJoin } = require("rxjs");
const { map, switchMap } = require("rxjs/operators");

export default class PostLoader {
  constructor(apiUrl = "http://localhost:3000") {
    this.apiUrl = apiUrl;
    this.container = document.getElementById("posts-container");
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${hours}:${minutes} ${day}.${month}.${year}`;
  }

  loadPosts$() {
    return ajax
      .getJSON(`${this.apiUrl}/posts/latest`)
      .pipe(map((response) => response.data));
  }

  loadComments$(postId) {
    return ajax
      .getJSON(`${this.apiUrl}/posts/${postId}/comments/latest`)
      .pipe(map((response) => response.data));
  }

  loadPostsWithComments$() {
    return this.loadPosts$().pipe(
      switchMap((posts) => {
        const commentsRequests = posts.map((post) =>
          this.loadComments$(post.id).pipe(
            map((comments) => ({ ...post, comments })),
          ),
        );
        return forkJoin(commentsRequests);
      }),
    );
  }

  async renderPosts(posts) {
    this.container.innerHTML = "";
    for (const post of posts) {
      const postElement = document.createElement("div");
      const image = document.createElement("img");
      const loadMoreButton = document.createElement("button");
      postElement.className = "post";

      const header = `
        <div class="post-header">
          <img src="${post.avatar}" alt="Avatar" class="avatar">
          <div class="author-data">
            <div class="author">${post.author}</div>
            <div class="date">${this.formatDate(post.created)}</div>
          </div>
        </div>
      `;

      image.alt = "Post Image";
      image.className = "post-image";

      try {
        const response = await fetch(post.image, { method: "HEAD" });
        if (response.ok) {
          image.src = post.image;
        } else {
          throw new Error("Image not available");
        }
      } catch (error) {
        image.src = "./img/default-image.jpg";
        console.error("Error fetching image:", error);
      }

      const comments = post.comments
        .map(
          (comment) => `
        <div class="comment">
          <img src="${comment.avatar}" alt="Avatar" class="avatar">
          <div class="comment-data">
            <div class="comment-author">${comment.author}</div>
            <div class="comment-content">${comment.content}</div>
          </div>
          <div class="comment-date">${this.formatDate(comment.created)}</div>
        </div>
      `,
        )
        .join("");

      loadMoreButton.className = "load-more";
      loadMoreButton.textContent = "Load More";
      loadMoreButton.addEventListener("click", () => location.reload());

      postElement.innerHTML = `
        ${header}
        <h2 class="comments-title">Latest comments</h2>
        <div class="comments">${comments}</div>
      `;

      postElement.insertBefore(
        image,
        postElement.querySelector(".comments-title"),
      );
      postElement.appendChild(loadMoreButton);
      this.container.appendChild(postElement);
    }
  }

  init() {
    this.loadPostsWithComments$().subscribe({
      next: (posts) => this.renderPosts(posts),
      error: (err) => console.error("Error:", err),
    });
  }
}
