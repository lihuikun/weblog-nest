import { Test, TestingModule } from '@nestjs/testing';
import { InterviewService } from './interview.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Interview } from './entities/interview.entity';
import { NotFoundException } from '@nestjs/common';

describe('InterviewService', () => {
  let service: InterviewService;

  const mockInterviewRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(10),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
    increment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewService,
        {
          provide: getRepositoryToken(Interview),
          useValue: mockInterviewRepository,
        },
      ],
    }).compile();

    service = module.get<InterviewService>(InterviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
}); 