import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

export class InsufficientCoinsError extends BadRequestException {
  constructor() {
    super('Insufficient coins to start this game');
  }
}

export class HintAlreadyUsedError extends BadRequestException {
  constructor() {
    super('A hint has already been used for this session');
  }
}

export class SessionNotFoundError extends NotFoundException {
  constructor() {
    super('Game session not found');
  }
}

export class SessionNotActiveError extends BadRequestException {
  constructor() {
    super('This game session is no longer active');
  }
}

export class SessionExpiredError extends BadRequestException {
  constructor() {
    super('This game session has expired');
  }
}

export class SuspectNotFoundError extends NotFoundException {
  constructor() {
    super('Suspect not found in this case');
  }
}
