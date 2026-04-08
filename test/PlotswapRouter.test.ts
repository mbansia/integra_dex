import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hardhat from "hardhat";
import { deployFixture } from "./helpers/fixtures.ts";

const { ethers } = hardhat as any;

describe("PlotswapRouter", () => {
  async function addInitialLiquidity() {
    const fixture = await loadFixture(deployFixture);
    const { router, tokenA, tokenB, user1 } = fixture;
    const deadline = (await time.latest()) + 3600;

    await router.connect(user1).addLiquidity(
      await tokenA.getAddress(), await tokenB.getAddress(),
      ethers.parseEther("1000"), ethers.parseEther("1000"),
      0, 0, user1.address, deadline
    );
    return { ...fixture, deadline };
  }

  describe("addLiquidity", () => {
    it("should create pair and add initial liquidity", async () => {
      const { factory, router, tokenA, tokenB, user1 } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3600;

      await router.connect(user1).addLiquidity(
        await tokenA.getAddress(), await tokenB.getAddress(),
        ethers.parseEther("1000"), ethers.parseEther("1000"),
        0, 0, user1.address, deadline
      );

      const pair = await factory.getPair(await tokenA.getAddress(), await tokenB.getAddress());
      expect(pair).to.not.equal(ethers.ZeroAddress);
    });

    it("should emit XPAction for add_liquidity", async () => {
      const { router, tokenA, tokenB, user1 } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3600;

      await expect(
        router.connect(user1).addLiquidity(
          await tokenA.getAddress(), await tokenB.getAddress(),
          ethers.parseEther("100"), ethers.parseEther("100"),
          0, 0, user1.address, deadline
        )
      ).to.emit(router, "XPAction").withArgs(user1.address, "add_liquidity", 150);
    });

    it("should revert after deadline", async () => {
      const { router, tokenA, tokenB, user1 } = await loadFixture(deployFixture);
      const pastDeadline = (await time.latest()) - 1;

      await expect(
        router.connect(user1).addLiquidity(
          await tokenA.getAddress(), await tokenB.getAddress(),
          ethers.parseEther("100"), ethers.parseEther("100"),
          0, 0, user1.address, pastDeadline
        )
      ).to.be.revertedWithCustomError(router, "PlotswapRouter__Expired");
    });
  });

  describe("swapExactTokensForTokens", () => {
    it("should swap tokens successfully", async () => {
      const { router, tokenA, tokenB, user1 } = await addInitialLiquidity();
      const deadline = (await time.latest()) + 3600;
      const balBefore = await tokenB.balanceOf(user1.address);

      await router.connect(user1).swapExactTokensForTokens(
        ethers.parseEther("10"), 0,
        [await tokenA.getAddress(), await tokenB.getAddress()],
        user1.address, deadline
      );

      expect(await tokenB.balanceOf(user1.address)).to.be.gt(balBefore);
    });

    it("should emit first_swap XP on first swap", async () => {
      const { router, tokenA, tokenB, user1 } = await addInitialLiquidity();
      const deadline = (await time.latest()) + 3600;

      await expect(
        router.connect(user1).swapExactTokensForTokens(
          ethers.parseEther("10"), 0,
          [await tokenA.getAddress(), await tokenB.getAddress()],
          user1.address, deadline
        )
      ).to.emit(router, "XPAction").withArgs(user1.address, "first_swap", 200);
    });

    it("should emit swap XP on subsequent swaps", async () => {
      const { router, tokenA, tokenB, user1 } = await addInitialLiquidity();
      const path = [await tokenA.getAddress(), await tokenB.getAddress()];

      await router.connect(user1).swapExactTokensForTokens(
        ethers.parseEther("10"), 0, path, user1.address, (await time.latest()) + 3600
      );

      await expect(
        router.connect(user1).swapExactTokensForTokens(
          ethers.parseEther("10"), 0, path, user1.address, (await time.latest()) + 3600
        )
      ).to.emit(router, "XPAction").withArgs(user1.address, "swap", 100);
    });

    it("should revert if output below minimum", async () => {
      const { router, tokenA, tokenB, user1 } = await addInitialLiquidity();
      const deadline = (await time.latest()) + 3600;

      await expect(
        router.connect(user1).swapExactTokensForTokens(
          ethers.parseEther("10"), ethers.parseEther("999"),
          [await tokenA.getAddress(), await tokenB.getAddress()],
          user1.address, deadline
        )
      ).to.be.revertedWithCustomError(router, "PlotswapRouter__InsufficientOutputAmount");
    });
  });

  describe("removeLiquidity", () => {
    it("should remove liquidity and return tokens", async () => {
      const { factory, router, tokenA, tokenB, user1 } = await addInitialLiquidity();
      const deadline = (await time.latest()) + 3600;

      const pairAddr = await factory.getPair(await tokenA.getAddress(), await tokenB.getAddress());
      const pair = await ethers.getContractAt("PlotswapPair", pairAddr);
      const lpBalance = await pair.balanceOf(user1.address);
      await pair.connect(user1).approve(await router.getAddress(), lpBalance);

      const balA = await tokenA.balanceOf(user1.address);
      const balB = await tokenB.balanceOf(user1.address);

      await router.connect(user1).removeLiquidity(
        await tokenA.getAddress(), await tokenB.getAddress(),
        lpBalance, 0, 0, user1.address, deadline
      );

      expect(await tokenA.balanceOf(user1.address)).to.be.gt(balA);
      expect(await tokenB.balanceOf(user1.address)).to.be.gt(balB);
    });

    it("should emit XPAction for remove_liquidity", async () => {
      const { factory, router, tokenA, tokenB, user1 } = await addInitialLiquidity();
      const deadline = (await time.latest()) + 3600;

      const pairAddr = await factory.getPair(await tokenA.getAddress(), await tokenB.getAddress());
      const pair = await ethers.getContractAt("PlotswapPair", pairAddr);
      const lpBalance = await pair.balanceOf(user1.address);
      await pair.connect(user1).approve(await router.getAddress(), lpBalance);

      await expect(
        router.connect(user1).removeLiquidity(
          await tokenA.getAddress(), await tokenB.getAddress(),
          lpBalance, 0, 0, user1.address, deadline
        )
      ).to.emit(router, "XPAction").withArgs(user1.address, "remove_liquidity", 50);
    });
  });

  describe("ERC-1404 integration", () => {
    it("should allow swap when all parties whitelisted for 1404", async () => {
      const { factory, router, securityToken, tokenA, user1, owner } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3600;
      const secAddr = await securityToken.getAddress();
      const tokenAAddr = await tokenA.getAddress();
      const routerAddr = await router.getAddress();

      await factory.createPair(secAddr, tokenAAddr);
      const pairAddr = await factory.getPair(secAddr, tokenAAddr);
      await securityToken.setWhitelist(pairAddr, true);

      await securityToken.approve(routerAddr, ethers.MaxUint256);
      await tokenA.approve(routerAddr, ethers.MaxUint256);

      await router.addLiquidity(
        secAddr, tokenAAddr,
        ethers.parseEther("100"), ethers.parseEther("100"),
        0, 0, owner.address, deadline
      );

      const newDeadline = (await time.latest()) + 3600;
      await router.connect(user1).swapExactTokensForTokens(
        ethers.parseEther("1"), 0,
        [tokenAAddr, secAddr], user1.address, newDeadline
      );

      expect(await securityToken.balanceOf(user1.address)).to.be.gt(0);
    });
  });
});
