import { Test, TestingModule } from '@nestjs/testing';
import { CopiesService } from './copies.service';

describe('CopiesService', () => {
  let service: CopiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CopiesService],
    }).compile();

    service = module.get<CopiesService>(CopiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
