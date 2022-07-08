process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let test_isbn;

beforeEach(async function () {
  let result = await db.query(
    `INSERT INTO
        books (isbn, amazon_url,author,language,pages,publisher,title,year)
        VALUES(
          '1111',
          'https://amazon.com/book',
          'Test Author',
          'English',
          5,
          'test publisher',
          'test book', 
          2022)
        RETURNING isbn`
  );
  test_isbn = result.rows[0].isbn;
  console.log(test_isbn);
});

describe("GET /books", function () {
  test("gets books from db", async function () {
    const response = await request(app).get(`/books`);
    const books = response.body.books;
    expect(books).toHaveLength(1);
    expect(books[0]).toHaveProperty("isbn");
    expect(books[0]).toHaveProperty("author");
  });
});

describe("POST /books", function () {
  test("posts a book to db", async function () {
    const response = await request(app).post(`/books`).send({
      isbn: "2222",
      amazon_url: "https://amazon.com/book",
      author: "testerson",
      language: "english",
      pages: 50,
      publisher: "test pub",
      title: "test book",
      year: 2022,
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("isbn");
  });
  test("Prevents creating a book missing properties", async function () {
    const response = await request(app).post(`/books`).send({
      isbn: "2333",
    });
    expect(response.statusCode).toBe(400);
  });
});

describe("GET /books/:isbn", function () {
  test("gets books from db", async function () {
    const response = await request(app).get(`/books/${test_isbn}`);
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.isbn).toBe(test_isbn);
  });
  test("invalid isbn returns 404", async function () {
    const response = await request(app).get(`/books/99999`);
    expect(response.statusCode).toBe(404);
  });
});


describe("PUT /books/:isbn", function () {
  test("updates a book in the db", async function () {
    const response = await request(app).put(`/books/${test_isbn}`).send({
      amazon_url: "https://amazon.com/book",
      author: "testerson",
      language: "english",
      pages: 51,
      publisher: "test pub",
      title: "test book",
      year: 2022,
    });
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.pages).toBe(51);
  });
  test("invalid isbn returns 404", async function () {
    const response = await request(app).put(`/books/99999`).send({
      amazon_url: "https://amazon.com/book",
      author: "testerson",
      language: "english",
      pages: 50,
      publisher: "test pub",
      title: "test book",
      year: 2022,
    });
    expect(response.statusCode).toBe(404);
  });
  test("Prevents updating a book with missing properties", async function () {
    const response = await request(app).put(`/books/${test_isbn}`).send({
      author: "silly man",
    });
    expect(response.statusCode).toBe(400);
  });
});

describe("DELETE /books/:isbn", function () {
    test("DELETES a book from db", async function () {
      const response = await request(app).delete(`/books/${test_isbn}`);
      expect(response.body).toEqual({ message: "Book deleted" });
    });
    test("invalid isbn returns 404", async function () {
        const response = await request(app).delete(`/books/99999`);
      expect(response.statusCode).toBe(404);
    });
  });
  

afterEach(async function () {
    await db.query("DELETE FROM BOOKS");
  });

afterAll(async function () {
  await db.end();
});
