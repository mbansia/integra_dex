import hardhat from "hardhat";
const { ethers } = hardhat as any;

export async function deployFixture() {
  const [owner, user1, user2, feeTo] = await ethers.getSigners();

  const Factory = await ethers.getContractFactory("PlotswapFactory");
  const factory = await Factory.deploy(owner.address);

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const tokenA = await MockERC20.deploy("Token A", "TKA", 18, ethers.parseEther("1000000"));
  const tokenB = await MockERC20.deploy("Token B", "TKB", 18, ethers.parseEther("1000000"));
  const tokenC = await MockERC20.deploy("Token C", "TKC", 18, ethers.parseEther("1000000"));
  const wirl = await MockERC20.deploy("Wrapped IRL", "WIRL", 18, ethers.parseEther("1000000"));

  const MockERC1404 = await ethers.getContractFactory("MockERC1404");
  const securityToken = await MockERC1404.deploy("Security Token", "SEC", ethers.parseEther("1000000"));

  const Router = await ethers.getContractFactory("PlotswapRouter");
  const router = await Router.deploy(
    await factory.getAddress(),
    await wirl.getAddress()
  );

  const tokenAAddr = await tokenA.getAddress();
  const tokenBAddr = await tokenB.getAddress();
  const [sortedA, sortedB] =
    tokenAAddr.toLowerCase() < tokenBAddr.toLowerCase()
      ? [tokenA, tokenB]
      : [tokenB, tokenA];

  const amount = ethers.parseEther("10000");
  await tokenA.transfer(user1.address, amount);
  await tokenA.transfer(user2.address, amount);
  await tokenB.transfer(user1.address, amount);
  await tokenB.transfer(user2.address, amount);
  await tokenC.transfer(user1.address, amount);
  await wirl.transfer(user1.address, amount);

  await securityToken.setWhitelist(user1.address, true);
  await securityToken.setWhitelist(user2.address, true);
  await securityToken.transfer(user1.address, amount);

  const routerAddr = await router.getAddress();
  const maxApproval = ethers.MaxUint256;

  await tokenA.connect(user1).approve(routerAddr, maxApproval);
  await tokenB.connect(user1).approve(routerAddr, maxApproval);
  await tokenC.connect(user1).approve(routerAddr, maxApproval);
  await wirl.connect(user1).approve(routerAddr, maxApproval);
  await securityToken.connect(user1).approve(routerAddr, maxApproval);

  await tokenA.connect(user2).approve(routerAddr, maxApproval);
  await tokenB.connect(user2).approve(routerAddr, maxApproval);

  return {
    factory, router,
    tokenA: sortedA, tokenB: sortedB, tokenC, wirl, securityToken,
    owner, user1, user2, feeTo,
  };
}
