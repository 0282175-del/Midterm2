import express from 'express';
import { AppError } from '../utils/appError.js';

const router = express.Router();
const API_URL = 'https://akabab.github.io/superhero-api/api/all.json';

async function getHeroes() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`Superhero API respondió con estado ${response.status}`);
  }

  return response.json();
}

function formatCard(hero) {
  return {
    id: hero.id,
    name: hero.name,
    image: hero.images?.sm || hero.images?.xs || null,
  };
}

function formatHero(hero, index, heroes) {
  const biography = hero.biography || {};
  const appearance = hero.appearance || {};
  const aliases = [];
  if (Array.isArray(biography.aliases)) {
    for (let aliasIndex = 0; aliasIndex < biography.aliases.length; aliasIndex = aliasIndex + 1) {
      const alias = biography.aliases[aliasIndex];
      if (alias && alias !== '-') {
        aliases.push(alias);
      }
    }
  }

  const biographyParts = [];
  if (biography.firstAppearance) {
    biographyParts.push(`First appeared: ${biography.firstAppearance}`);
  }
  if (biography.publisher) {
    biographyParts.push(`Publisher: ${biography.publisher}`);
  }
  if (biography.alignment) {
    biographyParts.push(`Alignment: ${biography.alignment}`);
  }

  let biographyText = 'No biography available.';
  if (biographyParts.length > 0) {
    biographyText = biographyParts.join(' · ');
  }

  let previousIndex = index - 1;
  if (previousIndex < 0) {
    previousIndex = heroes.length - 1;
  }

  let nextIndex = index + 1;
  if (nextIndex === heroes.length) {
    nextIndex = 0;
  }

  return {
    id: hero.id,
    name: hero.name,
    fullName: biography.fullName || 'Unknown',
    image: hero.images?.md || hero.images?.sm || null,
    powerstats: hero.powerstats || {},
    placeOfBirth: biography.placeOfBirth || 'Unknown',
    biography: biographyText,
    aliases: aliases,
    gender: appearance.gender || 'Unknown',
    race: appearance.race || 'Unknown',
    height: appearance.height || [],
    weight: appearance.weight || [],
    eyeColor: appearance.eyeColor || 'Unknown',
    hairColor: appearance.hairColor || 'Unknown',
    groupAffiliation: hero.connections?.groupAffiliation || 'Unknown',
    prevId: heroes[previousIndex].id,
    nextId: heroes[nextIndex].id,
  };
}

function findHeroIndex(heroes, identifier) {
  const name = String(identifier).trim().toLocaleLowerCase();
  for (let index = 0; index < heroes.length; index = index + 1) {
    const hero = heroes[index];
    if (String(hero.id) === identifier || hero.name.toLocaleLowerCase() === name) {
      return index;
    }
  }
  return -1;
}

router.get('/', async function (request, response, next) {
  try {
    const heroes = await getHeroes();
    const cards = [];
    for (let index = 0; index < heroes.length; index = index + 1) {
      cards.push(formatCard(heroes[index]));
    }
    response.json(cards);
  } catch (error) {
    next(new AppError('No se pudo cargar el catálogo de superhéroes.', 502, error.message));
  }
});

router.get('/search', async function (request, response, next) {
  const query = String(request.query.q || '').trim().toLocaleLowerCase();
  if (!query) {
    return next(new AppError('Escribe un nombre para buscar.', 400));
  }

  try {
    const heroes = await getHeroes();
    const matchingCards = [];
    for (let index = 0; index < heroes.length; index = index + 1) {
      const hero = heroes[index];
      if (hero.name.toLocaleLowerCase().includes(query)) {
        matchingCards.push(formatCard(hero));
      }
    }
    if (matchingCards.length === 0) {
      return next(new AppError(`No se encontró ningún personaje con el nombre "${request.query.q}".`, 404));
    }

    response.json(matchingCards);
  } catch (error) {
    next(new AppError('No se pudo buscar en el catálogo.', 502, error.message));
  }
});

router.get('/characters/:identifier', async function (request, response, next) {
  try {
    const heroes = await getHeroes();
    const index = findHeroIndex(heroes, request.params.identifier);
    if (index === -1) {
      return next(new AppError('Personaje no encontrado.', 404));
    }

    response.json(formatHero(heroes[index], index, heroes));
  } catch (error) {
    next(new AppError('No se pudo cargar el personaje.', 502, error.message));
  }
});

export default router;