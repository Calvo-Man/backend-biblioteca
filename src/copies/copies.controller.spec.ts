import { Test, TestingModule } from '@nestjs/testing';
import { CopiesController } from './copies.controller';
import { CopiesService } from './copies.service';

describe('CopiesController', () => {
  let controller: CopiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CopiesController],
      providers: [CopiesService],
    }).compile();

    controller = module.get<CopiesController>(CopiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
