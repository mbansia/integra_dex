import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { deployFixture } from "./helpers/fixtures.ts";

describe("PlotswapFactory", () => {
  describe("createPair", () => {
    it("should create a pair and emit PairCreated", async () => {
      const { factory, tokenA, tokenB } = await loadFixture(deployFixture);
      const tokenAAddr = await tokenA.getAddress();
      const tokenBAddr = await tokenB.getAddress();

      await expect(factory.createPair(tokenAAddr, tokenBAddr))
        .to.emit(factory, "PairCreated");

      const pair = await factory.getPair(tokenAAddr, tokenBAddr);
      expect(pair).to.not.equal("0x0000000000000000000000000000000000000000");
    });

    it("should store pair in both directions", async () => {
      const { factory, tokenA, tokenB } = await loadFixture(deployFixture);
      const a = await tokenA.getAddress();
      const b = await tokenB.getAddress();
      await factory.createPair(a, b);
      expect(await factory.getPair(a, b)).to.equal(await factory.getPair(b, a));
    });

    it("should revert on duplicate pair", async () => {
      const { factory, tokenA, tokenB } = await loadFixture(deployFixture);
      const a = await tokenA.getAddress();
      const b = await tokenB.getAddress();
      await factory.createPair(a, b);
      await expect(factory.createPair(a, b))
        .to.be.revertedWithCustomError(factory, "PlotswapFactory__PairExists");
    });

    it("should revert on identical tokens", async () => {
      const { factory, tokenA } = await loadFixture(deployFixture);
      const a = await tokenA.getAddress();
      await expect(factory.createPair(a, a))
        .to.be.revertedWithCustomError(factory, "PlotswapFactory__IdenticalAddresses");
    });

    it("should increment allPairsLength", async () => {
      const { factory, tokenA, tokenB } = await loadFixture(deployFixture);
      expect(await factory.allPairsLength()).to.equal(0);
      await factory.createPair(await tokenA.getAddress(), await tokenB.getAddress());
      expect(await factory.allPairsLength()).to.equal(1);
    });
  });

  describe("fee configuration", () => {
    it("should allow feeToSetter to set feeTo", async () => {
      const { factory, feeTo } = await loadFixture(deployFixture);
      await factory.setFeeTo(feeTo.address);
      expect(await factory.feeTo()).to.equal(feeTo.address);
    });

    it("should revert if non-setter tries to set feeTo", async () => {
      const { factory, user1 } = await loadFixture(deployFixture);
      await expect(factory.connect(user1).setFeeTo(user1.address))
        .to.be.revertedWithCustomError(factory, "PlotswapFactory__Forbidden");
    });
  });
});
