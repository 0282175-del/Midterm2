import express from 'express';
import apiRoutes from './routes/apiRoutes.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import { AppError } from './utils/appError.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Servir los archivos del frontend.
app.use(express.static('client'));

// Conectar las rutas de superhéroes.
app.use('/api', apiRoutes);

app.use(function (request, response, next) {
  next(new AppError(`Ruta no encontrada: ${request.originalUrl}`, 404));
});

app.use(errorMiddleware);

app.listen(PORT, function () {
  console.log(`Superhero-pedia lista en http://localhost:${PORT}`);
});