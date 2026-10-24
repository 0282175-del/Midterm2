# AI Prompt Log

## Team Members

- Grace
- Néstor

## Project

Superhero-pedia — Midterm II Catalog

---

We used AI to clear up questions and review fixes in the existing app.

---

# Prompt 1:

Why can’t I search by ID if the search box says I can?

## AI suggestion:

The API only searches names. Update the search behavior or change the hint so they match.

### Our application:

We checked where the search behavior and hint don’t match.

---

# Prompt 2:

Why does a search with no matches show an error?

## AI suggestion:

The API treats “no results” as a `404`. Show a simple no-results message for that case.

### Our application:

We reviewed how the app handles empty searches and real errors.

---

# Prompt 3:

Why do some character details show as `Unknown`?

## AI suggestion:

Check that the API and the modal use the same field names and formats.

### Our application:

We followed the data from the API to the modal.

---

# Prompt 4:

My CSS won’t load. I think the problem might be in this code. Is it, or could something else be wrong?

```js
import express from 'express';
import apiRoutes from './routes/apiRoutes.js';

const app = express();

app.use(express.static('public'));

app.use('/api', apiRoutes);
```

## AI suggestion:

In this project, the files are in `client/`, not `public/`. Use the right folder and check that the CSS path in the HTML matches its location. Also, make sure you run the server from `Midterm/starter`.

### Our application:

We checked the static files path and the CSS link.

---

# Prompt 5:

Why don’t Previous and Next change the character?

## AI suggestion:

Check that the buttons get the right IDs from the API and load the next character.

### Our application:

We traced how the IDs reach the buttons.

---

# Prompt 6:

What’s wrong with this code based on the project and the files I shared?

```js
import express from 'express';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import { AppError } from './utils/appError.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.static('client'));

app.use(function (request, response, next) {
  next(new AppError(`Route not found: ${request.originalUrl}`, 404));
});

app.use(errorMiddleware);
```

## AI suggestion:

The `client` folder matches this project, but the `apiRoutes` import and `app.use('/api', apiRoutes)` are missing. Without them, catalog requests reach the 404 handler. Add the routes before that handler.

### Our application:

We compared this with the current server file and found that the API routes weren’t connected.
