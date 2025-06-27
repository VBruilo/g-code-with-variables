import { PrinterController } from '../src/controller/printerController';

describe('PrinterController.startPrint', () => {
  const makePrusa = () => ({
    uploadAndPrint: jest.fn().mockResolvedValue(undefined),
    getCurrentJobId: jest.fn().mockResolvedValue('42'),
    getPrinterStatus: jest.fn(),
    getPrintStatus: jest.fn(),
    pauseJob: jest.fn(),
    resumeJob: jest.fn(),
    cancelJob: jest.fn(),
  });

  it('uses config parameters when fetch succeeds', async () => {
    const cfg = { fetchParameters: jest.fn().mockResolvedValue({ a: 1 }) } as any;
    const gcode = {
      createFinalGcode: jest.fn().mockResolvedValue('NEW'),
      loadFinalGcode: jest.fn(),
    } as any;
    const prusa = makePrusa();
    const controller = new PrinterController(cfg, gcode, prusa as any);

    const id = await controller.startPrint('m', 'c');

    expect(cfg.fetchParameters).toHaveBeenCalledWith('m', 'c');
    expect(gcode.createFinalGcode).toHaveBeenCalledWith({ a: 1 });
    expect(gcode.loadFinalGcode).not.toHaveBeenCalled();
    expect(prusa.uploadAndPrint).toHaveBeenCalledWith('NEW');
    expect(id).toBe('42');
  });

  it('falls back to last gcode when config fetch fails', async () => {
    const cfg = { fetchParameters: jest.fn().mockRejectedValue(new Error('fail')) } as any;
    const gcode = {
      createFinalGcode: jest.fn(),
      loadFinalGcode: jest.fn().mockResolvedValue('OLD'),
    } as any;
    const prusa = makePrusa();
    const controller = new PrinterController(cfg, gcode, prusa as any);

    const id = await controller.startPrint('m', 'c');

    expect(gcode.loadFinalGcode).toHaveBeenCalled();
    expect(gcode.createFinalGcode).not.toHaveBeenCalled();
    expect(prusa.uploadAndPrint).toHaveBeenCalledWith('OLD');
    expect(id).toBe('42');
  });

  it('generates gcode from defaults when no file is found', async () => {
    const cfg = { fetchParameters: jest.fn().mockRejectedValue(new Error('fail')) } as any;
    const gcode = {
      createFinalGcode: jest.fn().mockResolvedValue('NEW'),
      loadFinalGcode: jest.fn().mockResolvedValue(null),
    } as any;
    const prusa = makePrusa();
    const controller = new PrinterController(cfg, gcode, prusa as any);

    const id = await controller.startPrint('m', 'c');

    expect(gcode.loadFinalGcode).toHaveBeenCalled();
    expect(gcode.createFinalGcode).toHaveBeenCalledWith({});
    expect(prusa.uploadAndPrint).toHaveBeenCalledWith('NEW');
    expect(id).toBe('42');
  });
});
