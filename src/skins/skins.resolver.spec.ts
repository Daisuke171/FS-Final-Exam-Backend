import { Test, TestingModule } from '@nestjs/testing';
import { SkinsResolver } from './skins.resolver';

describe('SkinsResolver', () => {
  let resolver: SkinsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SkinsResolver],
    }).compile();

    resolver = module.get<SkinsResolver>(SkinsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
